import React, { useEffect } from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { useGame } from '../hooks/useGame';
import { useSocketActions } from '../hooks/useSocketActions';
import { useGameStore } from '../context/GameStore';

interface GamePageProps {
  onReturnToLobby: () => void;
}

// Bug #10: Uses useSocketActions instead of useSocket so no duplicate
// message handler is registered when this component mounts.
export const GamePage: React.FC<GamePageProps> = ({ onReturnToLobby }) => {
  const { isSpectator, status, isGameOver } = useGame();
  const { sendPlayerChat, sendSpectatorChat } = useSocketActions();

  useEffect(() => {
    if (status !== 'playing' || isGameOver) return;
    const timer = setInterval(() => {
      useGameStore.getState().tickTimer();
    }, 1000);
    return () => clearInterval(timer);
  }, [status, isGameOver]);

  const handleSendChat = (text: string) => {
    if (isSpectator) {
      sendSpectatorChat(text);
    } else {
      sendPlayerChat(text);
    }
  };

  return (
    <div className="game-page">
      <GameLayout onSendChat={handleSendChat} onReturnToLobby={onReturnToLobby} />
    </div>
  );
};
