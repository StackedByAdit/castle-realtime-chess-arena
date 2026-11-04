import React from 'react';
import { useGameStore } from '../../context/GameStore';
import { useGame } from '../../hooks/useGame';

export const GameInfo: React.FC = () => {
  const gameId = useGameStore((s) => s.gameId);
  const opponentId = useGameStore((s) => s.opponentId);
  const ratings = useGameStore((s) => s.ratings);
  const { playerId, playerColor, turn, isSpectator, getPlayerLabel } = useGame();

  const copyGameId = () => {
    if (gameId) navigator.clipboard.writeText(gameId);
  };

  return (
    <div className="game-info">
      <div className="game-info__row">
        <span className="game-info__label">Game ID</span>
        <span className="game-info__value game-info__gameid" onClick={copyGameId} title="Click to copy">
          {gameId ? gameId.slice(0, 10) + '...' : '—'}
          <span className="game-info__copy-icon">⎘</span>
        </span>
      </div>

      {!isSpectator && (
        <>
          <div className="game-info__row">
            <span className="game-info__label">You</span>
            <span className="game-info__value">
              {getPlayerLabel(playerId)}
              <span className="game-info__color-badge" style={{ background: playerColor === 'w' ? '#f0d9b5' : '#b58863' }}>
                {playerColor === 'w' ? 'White' : 'Black'}
              </span>
              {ratings && <span className="game-info__rating">{ratings[playerId]} elo</span>}
            </span>
          </div>
          <div className="game-info__row">
            <span className="game-info__label">Opponent</span>
            <span className="game-info__value">
              {opponentId ? getPlayerLabel(opponentId) : '—'}
              {ratings && opponentId && <span className="game-info__rating">{ratings[opponentId]} elo</span>}
            </span>
          </div>
        </>
      )}

      <div className="game-info__row">
        <span className="game-info__label">Turn</span>
        <span className="game-info__value">
          <span className="game-info__turn-dot" style={{ background: turn === 'w' ? '#f0d9b5' : '#b58863' }} />
          {turn === 'w' ? 'White' : 'Black'}
          {!isSpectator && turn === playerColor ? ' (You)' : ''}
        </span>
      </div>

      {isSpectator && (
        <div className="game-info__spectator-badge">👁 Spectating</div>
      )}
    </div>
  );
};
