import { Chess } from "chess.js";
import type { Player } from "./types.js";

export class Game {

    private chess: Chess;
    private playerWhite: Player;
    private playerBlack: Player;
    private time: number;

    constructor(playerWhite: Player, playerBlack: Player) {
        this.playerWhite = playerWhite;
        this.playerBlack = playerBlack;
        this.chess = new Chess();
        this.time = Date.now();
    }

    public makeMove(playerId: string, move: string) {

        if (this.chess.isGameOver()) {
            return {
                success: false,
                message: "Game already finished"
            };
        }

        const turn = this.chess.turn();

        if (
            (turn === "w" && playerId !== this.playerWhite.id) ||
            (turn === "b" && playerId !== this.playerBlack.id)
        ) {
            return {
                success: false,
                message: "Wait for Opponent to make a move"
            };
        }

        try {
            this.chess.move(move);
        } catch (e: any) {
            console.log("Invalid move error:", e.message);

            return {
                success: false,
                message: "Invalid move"
            };
        }

        const isGameOver = this.chess.isGameOver();

        let winner: string | null = null;
        let reason: string | null = null;

        if (this.chess.isCheckmate()) { // all the ways a game can end
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
            reason
        };
    }

    public getState() {
        return ({
            turn: this.chess.turn(),
            fen: this.chess.fen(),
            isGameOver: this.chess.isGameOver(),
            timeStamp: this.time,
            moves: this.chess.history()
        })
    }

    public getPlayers(): Player[] {
        return [this.playerWhite, this.playerBlack];
    }

}