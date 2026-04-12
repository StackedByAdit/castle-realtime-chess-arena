import React from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket';

interface GamePageProps {
  onReturnToLobby: () => void;
}

export const GamePage: React.FC<GamePageProps> = ({ onReturnToLobby }) => {
  const { isSpectator } = useGame();
  const { sendPlayerChat, sendSpectatorChat } = useSocket();

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
