import { Chess } from "chess.js";

const chess = new Chess();

console.log(chess.fen());

chess.move("e4");

// console.log(chess.fen());
// console.log(chess.board());
// console.log(chess.ascii());
// console.log(chess.fen)
// console.log(chess.pgn())
// console.log(chess.history());

chess.history({ verbose: true });

console.log(Date());
console.log(Date.now());