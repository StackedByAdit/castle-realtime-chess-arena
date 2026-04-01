import { Chess } from "chess.js";

export class Game {

    private chess: Chess;
    private playerWhite: string;
    private playerBlack: string;
    private time : number;

    constructor(playerWhite: string, playerBlack: string) {
        this.playerWhite = playerWhite;
        this.playerBlack = playerBlack;
        this.chess = new Chess();
        this.time = Date.now();
    }

    public makeMove(playerId: string, move: string) {
        const turn = this.chess.turn();

        if ((turn == "w" && playerId !== this.playerWhite) ||
            (turn == 'b' && playerId !== this.playerBlack)
        ) {
            return ({
                success: false,
                message: "Wait for Opponent to make a move"
            })
        }

        const result = this.chess.move(move);

        if(!result) {
            return({
                success : false,
                message : "Invalid Move"
            })
        }

        return({
            status : true,
            turn : this.chess.turn(),
            fen : this.chess.fen(),
        })
    }

    getState(){
        return ({
            turn : this.chess.turn(),
            fen : this.chess.fen(),
            isGameOver : this.chess.isGameOver(),
            timeStamp : this.time
        })
    }

}