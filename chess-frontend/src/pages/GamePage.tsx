import React from 'react';
import { GameLayout } from '../components/layout/GameLayout';
import { useGame } from '../hooks/useGame';
import { useSocketActions } from '../hooks/useSocketActions';

interface GamePageProps {
  onReturnToLobby: () => void;
}

// Bug #10: Uses useSocketActions instead of useSocket so no duplicate
// message handler is registered when this component mounts.
export const GamePage: React.FC<GamePageProps> = ({ onReturnToLobby }) => {
  const { isSpectator } = useGame();
  const { sendPlayerChat, sendSpectatorChat } = useSocketActions();

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
