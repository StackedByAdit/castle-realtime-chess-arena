import { Game } from "./Game.js"
import type { ChatMessage, CompletedGame, GameRoom, MoveResult, Player } from "./types.js";

const DEFAULT_RATING = 400;

export class GameManager {
  private games = new Map<string, GameRoom>();
  private playerToGame = new Map<string, string>();
  private spectatorToGame = new Map<string, string>();
  private waitingPlayers: string[] = [];
  private players = new Map<string, Player>();

  private completedGames = new Map<string, CompletedGame>();

  private onTimeout: ((gameId: string, winnerId: string, reason: string) => void) | null = null;

  setTimeoutHandler(handler: (gameId: string, winnerId: string, reason: string) => void) {
    this.onTimeout = handler;
  }

  createGame(player1Id: string, player2Id: string) {
    const gameId = Math.random().toString(36).slice(2);

    const player1 = this.players.get(player1Id)!;
    const player2 = this.players.get(player2Id)!;

    const game = new Game(player1, player2, (winnerId, loserId) => {
      const room = this.games.get(gameId);

      this.updateRatings(player1.id, player2.id, winnerId);

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

      if (room) {
        room.spectators.forEach(sid => this.spectatorToGame.delete(sid));
      }

      this.games.delete(gameId);
      this.playerToGame.delete(player1.id);
      this.playerToGame.delete(player2.id);

      this.onTimeout?.(gameId, winnerId, "timeout");
    });

    const room: GameRoom = {
      game,
      players: [player1, player2],
      spectators: [],
      playerChat: [],
      spectatorChat: []
    };

    this.games.set(gameId, room);
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

  handleMove(playerId: string, move: string): MoveResult {
    const gameId = this.playerToGame.get(playerId);

    if (!gameId) {
      return { success: false, message: "Game not found" };
    }

    const room = this.games.get(gameId);

    if (!room) {
      return { success: false, message: "Game not found" };
    }

    const result: MoveResult = room.game.makeMove(playerId, move);

    if (result.success === true && result.isGameOver) {
      const players = room.game.getPlayers();

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
        moves: room.game.getMoves(),
        createdAt: Date.now(),
        result: {
          winner: result.winner,
          reason: result.reason
        }
      });

      room.game.stopTimer();

      room.spectators.forEach(sid => this.spectatorToGame.delete(sid));

      this.games.delete(gameId);
      this.playerToGame.delete(players[0]!.id);
      this.playerToGame.delete(players[1]!.id);
    }

    return result;
  }

  addSpectator(spectatorId: string, gameId: string) {
    const room = this.games.get(gameId);
    if (!room) return null;

    // don't add the same spectator twice
    if (!room.spectators.includes(spectatorId)) {
      room.spectators.push(spectatorId);
      this.spectatorToGame.set(spectatorId, gameId);
    }

    return {
      state: room.game.getState(),
      spectatorChat: room.spectatorChat  
    };
  }

  removeSpectator(spectatorId: string) {
    const gameId = this.spectatorToGame.get(spectatorId);
    if (!gameId) return;

    const room = this.games.get(gameId);
    if (!room) return;

    room.spectators = room.spectators.filter(id => id !== spectatorId);
    this.spectatorToGame.delete(spectatorId);
  }

  getSpectatorsInGame(gameId: string): string[] {
    return this.games.get(gameId)?.spectators ?? [];
  }

  getGameIdForSpectator(spectatorId: string): string | null {
    return this.spectatorToGame.get(spectatorId) ?? null;
  }

  sendPlayerChat(senderId: string, text: string): { message: ChatMessage; gameId: string } | null {
    const gameId = this.playerToGame.get(senderId);
    if (!gameId) return null;

    const room = this.games.get(gameId);
    if (!room) return null;

    const isPlayer = room.players.some(p => p.id === senderId);
    if (!isPlayer) return null;

    const message: ChatMessage = {
      senderId,
      text,
      timestamp: Date.now()
    };

    room.playerChat.push(message);
    return { message, gameId };
  }

  sendSpectatorChat(senderId: string, text: string): { message: ChatMessage; gameId: string } | null {
    const gameId = this.spectatorToGame.get(senderId);
    if (!gameId) return null;

    const room = this.games.get(gameId);
    if (!room) return null;

    const message: ChatMessage = {
      senderId,
      text,
      timestamp: Date.now()
    };

    room.spectatorChat.push(message);
    return { message, gameId };
  }

  getPlayerChat(playerId: string): ChatMessage[] {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) return [];

    return this.games.get(gameId)?.playerChat ?? [];
  }


  getGameState(playerId: string) {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) return null;

    const room = this.games.get(gameId);
    if (!room) return null;

    return room.game.getState();
  }

  getPlayersInGame(playerId: string): Player[] {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) return [];

    const room = this.games.get(gameId);
    if (!room) return [];

    return room.game.getPlayers();
  }

  getPlayersInGameByGameId(gameId: string): Player[] {
    const room = this.games.get(gameId);
    if (!room) return [];
    return room.game.getPlayers();
  }

  getGameIdByPlayer(playerId: string): string | null {
    return this.playerToGame.get(playerId) ?? null;
  }

  handleDisconnect(playerId: string) {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) return;

    const room = this.games.get(gameId);
    if (!room) return;

    const players = room.game.getPlayers();
    const opponent = players.find(p => p.id !== playerId);

    if (opponent) {
      this.updateRatings(players[0]!.id, players[1]!.id, opponent.id);
    }

    room.game.stopTimer(); 

    room.spectators.forEach(sid => this.spectatorToGame.delete(sid));

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