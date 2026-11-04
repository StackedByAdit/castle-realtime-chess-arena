import React from 'react';
import { ChessBoard } from '../board/ChessBoard';
import { Timer } from '../game/Timer';
import { GameInfo } from '../game/GameInfo';
import { MovesList } from '../game/MovesList';
import { ChatBox } from '../chat/ChatBox';
import { GameOverlay } from '../game/GameOverlay';
import { useGameStore } from '../../context/GameStore';
import { useGame } from '../../hooks/useGame';

interface GameLayoutProps {
  onSendChat: (text: string) => void;
  onReturnToLobby: () => void;
}

export const GameLayout: React.FC<GameLayoutProps> = ({ onSendChat, onReturnToLobby }) => {
  const isGameOver = useGameStore((s) => s.isGameOver);
  const whiteTime = useGameStore((s) => s.whiteTime);
  const blackTime = useGameStore((s) => s.blackTime);
  const turn = useGameStore((s) => s.turn);
  const opponentId = useGameStore((s) => s.opponentId);
  const { playerId, playerColor, isSpectator, getPlayerLabel } = useGame();

  const topColor = playerColor === 'b' || isSpectator ? 'w' : 'b';
  const bottomColor = playerColor === 'b' || isSpectator ? 'b' : 'w';

  const topLabel = isSpectator
    ? topColor === 'w' ? 'White' : 'Black'
    : topColor === playerColor
    ? getPlayerLabel(playerId)
    : getPlayerLabel(opponentId ?? '?');

  const bottomLabel = isSpectator
    ? bottomColor === 'w' ? 'White' : 'Black'
    : bottomColor === playerColor
    ? getPlayerLabel(playerId)
    : getPlayerLabel(opponentId ?? '?');

  return (
    <div className="game-layout">
      {isGameOver && <GameOverlay onReturnToLobby={onReturnToLobby} />}

      <div className="game-layout__board-col">
        <Timer
          seconds={topColor === 'w' ? whiteTime : blackTime}
          isActive={turn === topColor}
          label={topLabel}
          color={topColor}
        />

        <ChessBoard />

        <Timer
          seconds={bottomColor === 'w' ? whiteTime : blackTime}
          isActive={turn === bottomColor}
          label={bottomLabel}
          color={bottomColor}
        />
      </div>

      <div className="game-layout__side-col">
        <GameInfo />
        <MovesList />
        <ChatBox onSend={onSendChat} />
      </div>
    </div>
  );
};
