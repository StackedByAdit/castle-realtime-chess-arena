import { Game } from "./Game.js"
import type { CompletedGame, MoveResult, Player } from "./types.js";

const DEFAULT_RATING = 400;

export class GameManager {
  private games = new Map<string, Game>();
  private playerToGame = new Map<string, string>();
  private waitingPlayers: string[] = [];
  private players = new Map<string, Player>();

  private completedGames = new Map<string, CompletedGame>();

  // callback so socketHandler can push GAME_OVER when the real-time timer fires
  private onTimeout: ((gameId: string, winnerId: string, reason: string) => void) | null = null;

  setTimeoutHandler(handler: (gameId: string, winnerId: string, reason: string) => void) {
    this.onTimeout = handler;
  }

  createGame(player1Id: string, player2Id: string) {
    const gameId = Math.random().toString(36).slice(2);

    const player1 = this.players.get(player1Id)!;
    const player2 = this.players.get(player2Id)!;

    const game = new Game(player1, player2, (winnerId, loserId) => { 
      const ratingUpdate = this.updateRatings(player1.id, player2.id, winnerId);

      this.completedGames.set(gameId, {
        gameId,
        players: game.getPlayers(),
        pgn: game.getState().fen,
        moves: game.getMoves(),
        createdAt: Date.now(),
        result: {
          winner: winnerId,
          reason: "timeout"
        }
      });

      this.games.delete(gameId);
      this.playerToGame.delete(player1.id);
      this.playerToGame.delete(player2.id);

      this.onTimeout?.(gameId, winnerId, "timeout");
    });

    this.games.set(gameId, game);
    this.playerToGame.set(player1Id, gameId);
    this.playerToGame.set(player2Id, gameId);

    return gameId;
  }

  addPlayer(playerId: string) {

    this.players.set(playerId, this.players.get(playerId) || {
      id: playerId,
      rating: DEFAULT_RATING
    });

    if (this.waitingPlayers.includes(playerId)) {
      return { status: "waiting" };
    }

    if (this.playerToGame.has(playerId)) {
      return { status: "in_game" };
    }

    const player = this.players.get(playerId)!;

    let bestIndex = -1;
    let smallestDiff = Infinity;

    for (let i = 0; i < this.waitingPlayers.length; i++) {
      const opponentId = this.waitingPlayers[i];
      if (!opponentId) continue;

      const opponent = this.players.get(opponentId)!;

      const diff = Math.abs(player.rating - opponent.rating);

      if (diff < smallestDiff) {
        smallestDiff = diff;
        bestIndex = i;
      }
    }

    if (bestIndex !== -1) {
      const opponentId = this.waitingPlayers.splice(bestIndex, 1)[0]!;

      const gameId = this.createGame(opponentId, playerId);

      return {
        status: "matched",
        gameId,
        players: [opponentId, playerId]
      };
    }

    this.waitingPlayers.push(playerId);

    return { status: "waiting" };
  }

  handleMove(playerId: string, move: string) : MoveResult {
    const gameId = this.playerToGame.get(playerId);

    if (!gameId) {
      return { success: false, message: "Game not found" };
    }

    const game = this.games.get(gameId);

    if (!game) {
      return { success: false, message: "Game not found" };
    }

    const result: MoveResult = game.makeMove(playerId, move);

    if (result.success === true && result.isGameOver) {
      const players = game.getPlayers();

      const ratingUpdate = this.updateRatings(
        players[0]!.id,
        players[1]!.id,
        result.winner ?? null
      );

      result.ratings = ratingUpdate;
      this.completedGames.set(gameId, {
        gameId,
        players,
        pgn: result.pgn,
        moves: game.getMoves(),
        createdAt: Date.now(),
        result: {
          winner: result.winner,
          reason: result.reason
        }
      });

      game.stopTimer();
      this.games.delete(gameId);
      this.playerToGame.delete(players[0]!.id);
      this.playerToGame.delete(players[1]!.id);
    }

    return result;
  }

  getGameState(playerId: string) {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) return null;

    const game = this.games.get(gameId);
    if (!game) return null;

    return game.getState();
  }

  getPlayersInGame(playerId: string): Player[] {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) return [];

    const game = this.games.get(gameId);
    if (!game) return [];

    return game.getPlayers();
  }

  handleDisconnect(playerId: string) {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) return;

    const game = this.games.get(gameId);
    if (!game) return;

    const players = game.getPlayers();
    const opponent = players.find(p => p.id !== playerId);

    if (opponent) {
      this.updateRatings(players[0]!.id, players[1]!.id, opponent.id);
    }

    game.stopTimer(); // clean up the real-time timer
    this.games.delete(gameId);
    this.playerToGame.delete(playerId);
    if (opponent) {
      this.playerToGame.delete(opponent.id);
    }
  }

  private updateRatings(
    player1Id: string,
    player2Id: string,
    winner: string | null
  ) {
    const K = 32;

    const p1 = this.players.get(player1Id)!;
    const p2 = this.players.get(player2Id)!;

    const r1 = p1.rating;
    const r2 = p2.rating;

    const expected1 = 1 / (1 + Math.pow(10, (r2 - r1) / 400));
    const expected2 = 1 / (1 + Math.pow(10, (r1 - r2) / 400));

    let score1 = 0;
    let score2 = 0;

    if (winner === player1Id) {
      score1 = 1;
      score2 = 0;
    } else if (winner === player2Id) {
      score1 = 0;
      score2 = 1;
    } else {
      score1 = 0.5;
      score2 = 0.5;
    }

    const newR1 = Math.round(r1 + K * (score1 - expected1));
    const newR2 = Math.round(r2 + K * (score2 - expected2));

    p1.rating = newR1;
    p2.rating = newR2;

    return {
      [player1Id]: newR1,
      [player2Id]: newR2
    };
  }

  getReplay(gameId: string) {
    return this.completedGames.get(gameId);
  }
}