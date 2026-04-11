import { useEffect, useRef } from "react";
import { useGameStore } from "../context/GameContext";
import { socketActions } from "../services/socket";

export function useGame(myId: string) {
  const store = useGameStore();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    status,
    isGameOver,
    setGameUpdate,
  } = store;

  useEffect(() => {
    if (status !== "playing" || isGameOver) {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }

    if (tickRef.current) clearInterval(tickRef.current);

    tickRef.current = setInterval(() => {
      const s = useGameStore.getState();
      if (s.isGameOver || s.status !== "playing") return;

      if (s.turn === "w") {
        setGameUpdate({
          fen: s.fen,
          turn: s.turn,
          whiteTime: Math.max(0, s.whiteTime - 1),
          blackTime: s.blackTime,
        });
      } else {
        setGameUpdate({
          fen: s.fen,
          turn: s.turn,
          whiteTime: s.whiteTime,
          blackTime: Math.max(0, s.blackTime - 1),
        });
      }
    }, 1000);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isGameOver]);

}