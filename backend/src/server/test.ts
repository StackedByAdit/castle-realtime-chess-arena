import { Game } from "./Game.js";


const game = new Game("aditya", "magnus");

console.log(game.getState());

console.log("\n--- Moves Start ---");

console.log("\nPlayer1 plays e4:");
console.log(game.makeMove("aditya", "e4"));

console.log("\nPlayer1 tries again (should fail):");
console.log(game.makeMove("aditya", "e5"));

console.log("\nPlayer2 plays e5:");
console.log(game.makeMove("magnus", "e5"));

console.log("\nInvalid move:");
console.log(game.makeMove("aditya", "invalid_move"));

console.log("\nPlayer1 plays Nf3:");
console.log(game.makeMove("aditya", "Nf3"));

console.log("\nFinal State:");
console.log(game.getState());