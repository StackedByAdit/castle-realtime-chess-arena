import { useEffect, useRef, useCallback } from "react";
import { useGameStore } from "../context/GameContext";
import { socketActions } from "../services/socket";

export function useGame(myId: string) {
  const store = useGameStore();
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    fen,
    turn,
    whiteTime,
    blackTime,
    color,
    opponent,
    status,
    isGameOver,
    winner,
    reason,
    ratings,
    playerChat,
    spectatorChat,
    isSpectator,
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

  const myColor = color ?? "w";
  const myTurn = !isSpectator && status === "playing" && turn === myColor && !isGameOver;

  const topColor    = myColor === "w" ? "b" : "w";
  const topId       = isSpectator ? "White" : (opponent ?? "Opponent");
  const bottomId    = isSpectator ? "Black" : myId;
  const topTime     = topColor === "w" ? whiteTime : blackTime;
  const bottomTime  = myColor  === "w" ? whiteTime : blackTime;
  const topActive   = turn === topColor;
  const bottomActive = turn === myColor;

  const sendMove = useCallback((move: string) => {
    if (!myTurn) return;
    socketActions.move(move);
  }, [myTurn]);

  const sendPlayerChat = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isSpectator) return;
    socketActions.playerChat(trimmed);
  }, [isSpectator]);

  const sendSpectatorChat = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !isSpectator) return;
    socketActions.spectatorChat(trimmed);
  }, [isSpectator]);

  return {
    fen,
    turn,
    myColor,
    myTurn,
    isSpectator,

    topId,
    bottomId,
    topColor,
    topTime,
    bottomTime,
    topActive,
    bottomActive,

    status,
    isGameOver,
    winner,
    reason,
    ratings,

    playerChat,
    spectatorChat,

    sendMove,
    sendPlayerChat,
    sendSpectatorChat,
  };
}