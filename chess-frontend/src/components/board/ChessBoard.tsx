import React, { useState, useEffect } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import { useGameStore } from '../../context/GameStore';
import { useGame } from '../../hooks/useGame';
import { useSocketActions } from '../../hooks/useSocketActions';
import type { Square, CustomSquareProps, CustomSquareRenderer } from 'react-chessboard/dist/chessboard/types';

const CustomSquare = React.forwardRef<HTMLDivElement, CustomSquareProps>(
  ({ children, style }, ref) => {
    const dotColor = (style as Record<string, unknown>).dotColor as string | undefined;
    return (
      <div ref={ref} style={{ ...style, position: 'relative' }}>
        {children}
        {dotColor && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              margin: 'auto',
              width: '28%',
              height: '28%',
              borderRadius: '50%',
              backgroundColor: dotColor,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        )}
      </div>
    );
  }
);

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

  const [moveSquares, setMoveSquares] = useState<Record<string, { dotColor: string }>>({});
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);

  useEffect(() => {
    setMoveSquares({});
    setSelectedSquare(null);
  }, [fen]);

  const showLegalMoves = (square: Square) => {
    if (!isMyTurn) return;
    const moves = new Chess(fen).moves({ square, verbose: true });
    if (!moves.length) {
      setMoveSquares({});
      setSelectedSquare(null);
      return;
    }
    const styles: Record<string, { dotColor: string }> = {};
    moves.forEach((m) => {
      styles[m.to] = {
        dotColor: m.captured ? 'rgba(239, 68, 68, 0.55)' : 'rgba(0, 0, 0, 0.25)',
      };
    });
    setMoveSquares(styles);
    setSelectedSquare(square);
  };

  const getCheckSquare = () => {
    const chess = new Chess(fen);
    if (!chess.inCheck()) return null;
    const isMate = chess.isCheckmate();
    const king = chess.board().flat().find((p) => p?.type === 'k' && p?.color === chess.turn());
    if (!king) return null;
    return {
      square: king.square as Square,
      style: {
        backgroundColor: isMate ? 'rgba(220, 38, 38, 0.85)' : 'rgba(239, 68, 68, 0.45)',
      },
    };
  };

  const checkSquare = getCheckSquare();
  const customStyles = checkSquare
    ? { ...moveSquares, [checkSquare.square]: { ...checkSquare.style, ...moveSquares[checkSquare.square] } }
    : moveSquares;

  const boardOrientation = isSpectator ? 'white' : playerColor === 'b' ? 'black' : 'white';

  const onDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    setMoveSquares({});
    setSelectedSquare(null);
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
    setMoveSquares({});
    setSelectedSquare(null);
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
        onPieceDragBegin={(_piece, square) => showLegalMoves(square)}
        onPieceDragEnd={() => {
          setMoveSquares({});
          setSelectedSquare(null);
        }}
        onSquareClick={(square) => {
          if (selectedSquare) {
            if (onDrop(selectedSquare, square)) return;
          }
          showLegalMoves(square);
        }}
        customSquare={CustomSquare as unknown as CustomSquareRenderer}
        customSquareStyles={customStyles}
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
