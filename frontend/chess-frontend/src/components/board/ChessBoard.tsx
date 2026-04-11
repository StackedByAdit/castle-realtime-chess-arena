import { Chessboard } from "react-chessboard";
import { socketActions } from "../../services/socket";
import { useGameStore } from "../../context/GameContext";

export default function ChessBoard() {
    const fen = useGameStore((s) => s.fen);
    const turn = useGameStore((s) => s.turn);
    const color = useGameStore((s) => s.color);
    const isGameOver = useGameStore((s) => s.isGameOver);

    const isMyTurn =
        (turn === "w" && color === "w") ||
        (turn === "b" && color === "b");

    const onDrop = (from: string, to: string) => {
        if (!isMyTurn || isGameOver) return false;

        socketActions.move(from + to);

        return true;
    };

    return (
        <div
            style={{
                width: "min(90vw, 600px)",
                margin: "0 auto"
            }}
        >

            <Chessboard
                position={fen}
                onPieceDrop={onDrop}
                boardOrientation={color === "w" ? "white" : "black"}
            />
        </div>
    );
}