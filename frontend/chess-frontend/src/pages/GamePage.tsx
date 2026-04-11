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

}