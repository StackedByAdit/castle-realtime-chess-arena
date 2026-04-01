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

  
}