import { useEffect, useRef } from "react";
import { useSocket } from "../hooks/useSocket";
import { socketActions } from "../services/socket";
import { useGameStore } from "../context/GameContext";

export default function GamePage() {
  const socketRef = useSocket();
  const hasJoined = useRef(false);

  const {
    status,
    fen,
    turn,
    whiteTime,
    blackTime,
    isGameOver,
    winner,
    reason,
    color,
    opponent,
    playerChat
  } = useGameStore();

  const join = () => {
    const playerId = "user-" + Math.random();
    socketActions.join(playerId);
  };

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || hasJoined.current) return;

    if (socket.readyState === WebSocket.OPEN) {
      join();
    } else {
      socket.onopen = () => join();
    }

    hasJoined.current = true;
  }, [socketRef]);

  if (status === "idle") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <p>Connecting...</p>
      </div>
    );
  }

  if (status === "waiting") {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">Waiting for opponent...</p>
      </div>
    );
  }

  if (status === "playing") {
    return (
      <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center gap-4">

        <h2>Game Started 🎮</h2>

        <div>
          <p><b>You:</b> {color}</p>
          <p><b>Opponent:</b> {opponent}</p>
        </div>

        <div>
          <p>Turn: {turn}</p>
        </div>

        <div>
          <p>White Time: {whiteTime}s</p>
          <p>Black Time: {blackTime}s</p>
        </div>

        <div>
          <p><b>FEN:</b></p>
          <code className="text-xs">{fen}</code>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => socketActions.move("e2e4")}
            className="bg-blue-500 px-3 py-1 rounded"
          >
            e2e4
          </button>

          <button
            onClick={() => socketActions.move("d2d4")}
            className="bg-green-500 px-3 py-1 rounded"
          >
            d2d4
          </button>
        </div>

        <div className="mt-4">
          <p>Chat:</p>
          {playerChat.map((msg, i) => (
            <div key={i}>
              <b>{msg.senderId}:</b> {msg.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (status === "finished") {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-4">
        {isGameOver && (
          <div>
            <h2>Game Over</h2>

            <p>Winner: {winner ?? "Draw"}</p>
            <p>Reason: {reason}</p>
          </div>
        )}

        <button
          onClick={() => useGameStore.getState().reset()}
          className="bg-red-500 px-4 py-2 rounded"
        >
          Reset
        </button>
      </div>
    );
  }

  return null;
}