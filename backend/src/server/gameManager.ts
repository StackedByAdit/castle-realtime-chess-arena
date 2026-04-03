import { Game } from "./Game.js"
import type { Player } from "./types.js";

export class GameManager {
  private games = new Map<string, Game>();
  private playerToGame = new Map<string, string>();
  private waitingPlayers: string[] = [];
  private players = new Map<string, Player>();


  createGame(player1: Player, player2: Player) {
    const gameId = Math.random().toString(36).slice(2);

    const game = new Game(player1, player2);

    this.games.set(gameId, game);
    this.playerToGame.set(player1.id, gameId);
    this.playerToGame.set(player2.id, gameId);

    return gameId;
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