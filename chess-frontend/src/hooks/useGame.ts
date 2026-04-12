import { useGameStore } from '../context/GameStore';

export function useGame() {
  const playerId = useGameStore((s) => s.playerId);
  const playerColor = useGameStore((s) => s.playerColor);
  const turn = useGameStore((s) => s.turn);
  const isGameOver = useGameStore((s) => s.isGameOver);
  const isSpectator = useGameStore((s) => s.isSpectator);
  const status = useGameStore((s) => s.status);

  const isMyTurn = !isSpectator && !isGameOver && turn === playerColor;

  const getPlayerLabel = (id: string) => {
    if (id === playerId) return 'You';
    return id.slice(0, 8) + '...';
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return {
    playerId,
    playerColor,
    turn,
    isGameOver,
    isSpectator,
    status,
    isMyTurn,
    getPlayerLabel,
    formatTime,
  };
}
