import React from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../../context/GameStore';
import { useGame } from '../../hooks/useGame';
import { useSocketActions } from '../../hooks/useSocketActions';
import type { Square } from 'react-chessboard/dist/chessboard/types';

/**
 * Bug #14: Pawn promotion is now handled via onPromotionPieceSelect, which
 * shows react-chessboard's built-in promotion dialog and sends the correct
 * UCI move string (e.g. "e7e8q") to the server.
 *
 * Bug #15: Client-side move validation using chess.js so invalid drops snap
 * back immediately without incurring a server round-trip.
 *
 * Bug #10: Uses useSocketActions instead of useSocket so no extra handler
 * is registered when this component mounts.
 */
export const ChessBoard: React.FC = () => {
  const fen = useGameStore((s) => s.fen);
  const { playerColor, isMyTurn, isSpectator, isGameOver } = useGame();
  const { makeMove } = useSocketActions();

  const boardOrientation = isSpectator ? 'white' : playerColor === 'b' ? 'black' : 'white';

  const onDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (!isMyTurn) return false;

    // Bug #15: Validate the move locally before sending to server.
    // Also detect pawn promotions and defer them to onPromotionPieceSelect.
    const testChess = new Chess(fen);
    const piece = testChess.get(sourceSquare);

    // Bug #14: If this is a pawn reaching the last rank, return false so the
    // board shows the promotion dialog via onPromotionPieceSelect instead.
    if (
      piece?.type === 'p' &&
      ((piece.color === 'w' && targetSquare[1] === '8') ||
        (piece.color === 'b' && targetSquare[1] === '1'))
    ) {
      return false;
    }

    // Validate the move locally; snap piece back if invalid.
    try {
      testChess.move({ from: sourceSquare, to: targetSquare });
    } catch {
      return false;
    }

    makeMove(`${sourceSquare}${targetSquare}`);
    return true;
  };

  // Bug #14: Called by react-chessboard after the user selects a promotion piece.
  const onPromotionPieceSelect = (
    piece?: string,
    fromSquare?: Square,
    toSquare?: Square
  ): boolean => {
    if (!piece || !fromSquare || !toSquare || !isMyTurn) return false;
    // piece is formatted as e.g. 'wQ', 'bR' — extract the letter and lowercase it.
    const promotionPiece = piece[1]?.toLowerCase() ?? 'q';
    makeMove(`${fromSquare}${toSquare}${promotionPiece}`);
    return true;
  };

  return (
    <div className="chessboard-wrapper">
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        onPromotionPieceSelect={onPromotionPieceSelect}
        promotionDialogVariant="modal"
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
