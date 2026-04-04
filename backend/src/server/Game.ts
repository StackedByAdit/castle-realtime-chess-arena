import { Chess } from "chess.js";
import type { Player } from "./types.js";

export class Game {

    private chess: Chess;
    private playerWhite: Player;
    private playerBlack: Player;
    private time: number;
    private whiteTime = 300;
    private blackTime = 300;
    private lastMoveTime = Date.now();

    constructor(playerWhite: Player, playerBlack: Player) {
        this.playerWhite = playerWhite;
        this.playerBlack = playerBlack;
        this.chess = new Chess();
        this.time = Date.now();
    }

    public makeMove(playerId: string, move: string) {

        if (this.chess.isGameOver()) {
            return { success: false, message: "Game already finished" };
        }

        const turn = this.chess.turn();

        if (
            (turn === "w" && playerId !== this.playerWhite.id) ||
            (turn === "b" && playerId !== this.playerBlack.id)
        ) {
            return { success: false, message: "Wait for opponent" };
        }

        const now = Date.now();
        const diff = Math.floor((now - this.lastMoveTime) / 1000);

        if (turn === "w") {
            this.whiteTime = Math.max(0, this.whiteTime - diff);
        } else {
            this.blackTime = Math.max(0, this.blackTime - diff);
        }

        this.lastMoveTime = now;

        let winner: string | null = null;
        let reason: string | null = null;

        if (this.whiteTime <= 0) {
            winner = this.playerBlack.id;
            reason = "timeout";
        } else if (this.blackTime <= 0) {
            winner = this.playerWhite.id;
            reason = "timeout";
        }

        if (winner) {
            return {
                success: true,
                isGameOver: true,
                winner,
                reason,
                fen: this.chess.fen(),
                turn: this.chess.turn(),
                whiteTime: this.whiteTime,
                blackTime: this.blackTime,
                pgn: this.chess.pgn()
            };
        }

        try {
            this.chess.move(move);
        } catch {
            return { success: false, message: "Invalid move" };
        }

        let isGameOver = this.chess.isGameOver() || winner !== null;
        
        if (this.chess.isCheckmate()) {
            winner =
                this.chess.turn() === "w"
                    ? this.playerBlack.id
                    : this.playerWhite.id;
            reason = "checkmate";
        } else if (this.chess.isStalemate()) {
            reason = "stalemate";
        } else if (this.chess.isThreefoldRepetition()) {
            reason = "threefold repetition";
        } else if (this.chess.isInsufficientMaterial()) {
            reason = "insufficient material";
        } else if (this.chess.isDraw()) {
            reason = "draw";
        }

        return {
            success: true,
            turn: this.chess.turn(),
            fen: this.chess.fen(),
            isGameOver,
            winner,
            reason,
            whiteTime: this.whiteTime,
            blackTime: this.blackTime,
            pgn: this.chess.pgn()
        };
    }

    public getState() {
        return {
            turn: this.chess.turn(),
            fen: this.chess.fen(),
            isGameOver: this.chess.isGameOver(),
            timeStamp: this.time,
            moves: this.chess.history(),
            whiteTime: this.whiteTime,
            blackTime: this.blackTime
        };
    }

    public getPlayers(): Player[] {
        return [this.playerWhite, this.playerBlack];
    }

}