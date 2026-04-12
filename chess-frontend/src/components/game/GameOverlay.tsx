import React from 'react';
import { useGameStore } from '../../context/GameStore';
import { useGame } from '../../hooks/useGame';

interface GameOverlayProps {
  onReturnToLobby: () => void;
}

const REASON_LABELS: Record<string, string> = {
  checkmate: 'Checkmate',
  stalemate: 'Stalemate — Draw',
  timeout: 'Time ran out',
  'threefold repetition': 'Threefold Repetition — Draw',
  'insufficient material': 'Insufficient Material — Draw',
  draw: 'Draw',
  opponent_disconnected: 'Opponent disconnected',
};

export const GameOverlay: React.FC<GameOverlayProps> = ({ onReturnToLobby }) => {
  const winner = useGameStore((s) => s.winner);
  const reason = useGameStore((s) => s.reason);
  const ratings = useGameStore((s) => s.ratings);
  const { playerId, isSpectator } = useGame();

  const isDraw = !winner;
  const youWon = winner === playerId;
  const _youLost = !isDraw && !youWon && !isSpectator; void _youLost;

  const headline = isDraw
    ? 'Draw!'
    : isSpectator
    ? `${winner?.slice(0, 8)}... wins!`
    : youWon
    ? 'You Win! 🎉'
    : 'You Lose';

  const headlineClass = isDraw
    ? 'overlay__headline--draw'
    : youWon
    ? 'overlay__headline--win'
    : 'overlay__headline--lose';

  return (
    <div className="overlay-backdrop">
      <div className="overlay-card">
        <h2 className={`overlay__headline ${headlineClass}`}>{headline}</h2>

        {reason && (
          <p className="overlay__reason">{REASON_LABELS[reason] ?? reason}</p>
        )}

        {ratings && !isSpectator && (
          <div className="overlay__ratings">
            <div className="overlay__rating-row">
              <span>Your new rating</span>
              <strong>{ratings[playerId]} elo</strong>
            </div>
          </div>
        )}

        <button className="btn btn--primary" onClick={onReturnToLobby}>
          Return to Lobby
        </button>
      </div>
    </div>
  );
};
