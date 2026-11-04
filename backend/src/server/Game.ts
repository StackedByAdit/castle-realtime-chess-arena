import { Chess } from "chess.js";
import type { MoveResult, Move, Player } from "./types.js";

export class Game {

    private chess: Chess;
    private playerWhite: Player;
    private playerBlack: Player;
    private time: number;
    private whiteTime = 300;
    private blackTime = 300;
    private lastMoveTime = Date.now();
    private timerInterval: NodeJS.Timeout | null = null;

    // Bug fixes applied here:
    //  #1  — Timer now checks BOTH colours; winner direction was also
    //         backwards in the original (e.g. White's clock expiring passed
    //         playerWhite.id as winnerId — Black should win).
    //  #4  — onTimeout callback signature simplified to (winnerId: string).
    //  #6  — makeMove / getState now return `moves` so the play loop can
    //         broadcast the full move list on every update.
    constructor(
        playerWhite: Player,
        playerBlack: Player,
        onTimeout: (winnerId: string) => void
    ) {
        this.playerWhite = playerWhite;
        this.playerBlack = playerBlack;
        this.chess = new Chess();
        this.time = Date.now();

        this.timerInterval = setInterval(() => {
            if (this.chess.isGameOver()) {
                this.stopTimer();
                return;
            }

            const now = Date.now();
            const elapsed = Math.floor((now - this.lastMoveTime) / 1000);
            const turn = this.chess.turn();

            if (turn === "w" && this.whiteTime - elapsed <= 0) {
                // White ran out of time → Black wins
                this.whiteTime = 0;
                this.stopTimer();
                onTimeout(this.playerBlack.id);
            } else if (turn === "b" && this.blackTime - elapsed <= 0) {
                // Black ran out of time → White wins
                this.blackTime = 0;
                this.stopTimer();
                onTimeout(this.playerWhite.id);
            }
        }, 1000);
    }

    public stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /** Maps chess.js verbose history to our leaner Move type. */
    public getMoves(): Move[] {
        return this.chess.history({ verbose: true }).map(m => ({
            color: m.color,
            from: m.from,
            to: m.to,
            piece: m.piece,
            san: m.san,
        }));
    }

    /** Returns the full PGN string for the current game. */
    public getPgn(): string {
        return this.chess.pgn();
    }

    public makeMove(playerId: string, move: string): MoveResult {

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

        // Check for move-boundary timeout (player submitted a move after time expired)
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
            this.stopTimer();
            return {
                success: true,
                isGameOver: true,
                winner,
                reason,
                fen: this.chess.fen(),
                turn: this.chess.turn(),
                whiteTime: this.whiteTime,
                blackTime: this.blackTime,
                pgn: this.chess.pgn(),
                moves: this.getMoves(),
            };
        }

        try {
            this.chess.move(move);
        } catch {
            return { success: false, message: "Invalid move" };
        }

        const isGameOver = this.chess.isGameOver();

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

        if (isGameOver) {
            this.stopTimer();
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
            pgn: this.chess.pgn(),
            moves: this.getMoves(),
        };
    }

    public getState() {
        const elapsed = Math.floor((Date.now() - this.lastMoveTime) / 1000);
        const turn = this.chess.turn();

        return {
            turn,
            fen: this.chess.fen(),
            isGameOver: this.chess.isGameOver(),
            timeStamp: this.time,
            moves: this.getMoves(),
            whiteTime: turn === "w" ? Math.max(0, this.whiteTime - elapsed) : this.whiteTime,
            blackTime: turn === "b" ? Math.max(0, this.blackTime - elapsed) : this.blackTime,
        };
    }

    public getPlayers(): Player[] {
        return [this.playerWhite, this.playerBlack];
    }

}