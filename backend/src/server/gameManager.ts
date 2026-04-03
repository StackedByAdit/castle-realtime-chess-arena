import { Game } from "./Game.js"

export class GameManager {
  private games = new Map<string, Game>();
  private playerToGame = new Map<string, string>();

  createGame(player1: string, player2: string) {
    const gameId = Math.random().toString();

    const game = new Game(player1, player2);

    this.games.set(gameId, game);
    this.playerToGame.set(player1, gameId);
    this.playerToGame.set(player2, gameId);

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

  getPlayersInGame(playerId: string): string[] {
    const gameId = this.playerToGame.get(playerId);
    if (!gameId) return [];

    const game = this.games.get(gameId);
    if (!game) return [];

    return game.getPlayers();
  }
}