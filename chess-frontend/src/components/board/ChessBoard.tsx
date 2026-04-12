import React from 'react';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../../context/GameStore';
import { useGame } from '../../hooks/useGame';
import { useSocket } from '../../hooks/useSocket';
import type { Square } from 'react-chessboard/dist/chessboard/types';

export const ChessBoard: React.FC = () => {
  const fen = useGameStore((s) => s.fen);
  const { playerColor, isMyTurn, isSpectator, isGameOver } = useGame();
  const { makeMove } = useSocket();

  const boardOrientation = isSpectator ? 'white' : playerColor === 'b' ? 'black' : 'white';

  const onDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (!isMyTurn) return false;
    makeMove(`${sourceSquare}${targetSquare}`);
    return true;
  };

  return (
    <div className="chessboard-wrapper">
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        boardOrientation={boardOrientation}
        arePiecesDraggable={!isSpectator && !isGameOver}
        customBoardStyle={{
          borderRadius: '4px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        }}
        customDarkSquareStyle={{ backgroundColor: '#b58863' }}
        customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
      />
    </div>
  );
};
