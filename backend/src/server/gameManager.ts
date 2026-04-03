import { Game } from "./Game.js"
import type { Player } from "./types.js";



export class GameManager {
  private games = new Map<string, Game>();
  private playerToGame = new Map<string, string>();
  private waitingPlayers: string[] = [];
  private players = new Map<string, Player>();


  createGame(player1Id: string, player2Id: string) {
    const gameId = Math.random().toString(36).slice(2);


    const player1 = this.players.get(player1Id)!;
    const player2 = this.players.get(player2Id)!; //they are player objects 

    const game = new Game(player1, player2); // player objects are the new inputs 

    this.games.set(gameId, game);
    this.playerToGame.set(player1Id, gameId);
    this.playerToGame.set(player2Id, gameId);

    return gameId;
  }

  addPlayer(playerId: string) {

    this.players.set(playerId, this.players.get(playerId) || {
      id: playerId,
      rating: 1200
    });

    const player = this.players.get(playerId)!; // this will be an object

    let bestIndex = -1;
    let smallestDiff = Infinity;

    for (let i = 0; i < this.waitingPlayers.length; i++) {
      const opponentId = this.waitingPlayers[i];
      if (!opponentId) continue; // can this be a problem that before any player is added to waiting players, the array will be empty, so everything is undefined. ive forced ! this to remove undefined error. check it once testing
      const opponent = this.players.get(opponentId)!; // object

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

  handleMove(playerId: string, move: string) {
    const gameId = this.playerToGame.get(playerId);

    if (!gameId) {
      return { success: false, message: "Game not found" };
    }

    const game = this.games.get(gameId);

    if (!game) {
      return { success: false, message: "Game not found" };
    }

    return game.makeMove(playerId, move);
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
}