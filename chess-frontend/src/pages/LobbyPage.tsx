import React, { useState, useEffect } from 'react';
import { useGame } from '../hooks/useGame';
import { useSocketActions } from '../hooks/useSocketActions';
import { useGameStore } from '../context/GameStore';

/**
 * Bug #7:  joinGame no longer calls onNavigateToGame() prematurely.
 *          Navigation is triggered by App.tsx's status watcher when the server
 *          confirms GAME_START (status → 'playing').
 *
 * Bug #8:  Same fix for spectateGame.
 *
 * Bug #10: Uses useSocketActions instead of useSocket.
 *
 * Bug #16: Displays lastError from the store (e.g. "Replay not found") and
 *          shows a loading state while a replay request is in flight.
 */
export const LobbyPage: React.FC = () => {
  const [playerIdInput, setPlayerIdInput] = useState('');
  const [spectateGameId, setSpectateGameId] = useState('');
  const [spectatorId, setSpectatorId] = useState('');
  const [replayGameId, setReplayGameId] = useState('');
  const [replayLoading, setReplayLoading] = useState(false);

  const { status } = useGame();
  const { joinGame, spectateGame, getReplay } = useSocketActions();
  const lastError = useGameStore((s) => s.lastError);
  const clearError = useGameStore((s) => s.clearError);
  const replayData = useGameStore((s) => s.replayData);

  // Stop loading spinner once the replay arrives or an error is shown.
  useEffect(() => {
    if (replayData) setReplayLoading(false);
  }, [replayData]);

  useEffect(() => {
    if (lastError) setReplayLoading(false);
  }, [lastError]);

  // Clear any leftover errors when the page unmounts.
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleJoin = () => {
    if (!playerIdInput.trim()) return;
    clearError();
    joinGame(playerIdInput.trim());
    // Bug #7: Navigation happens automatically via App.tsx's useEffect
    // that watches for status === 'playing'. No premature redirect here.
  };

  const handleSpectate = () => {
    if (!spectateGameId.trim() || !spectatorId.trim()) return;
    clearError();
    spectateGame(spectatorId.trim(), spectateGameId.trim());
    // Bug #8: Same — navigation fires when status becomes 'spectating'.
  };

  const handleReplay = () => {
    if (!replayGameId.trim()) return;
    clearError();
    setReplayLoading(true);
    getReplay(replayGameId.trim());
  };

  return (
    <div className="lobby">
      <div className="lobby__header">
        <div className="lobby__logo">♛</div>
        <h1 className="lobby__title">Castle</h1>
        <p className="lobby__sub">Real-time multiplayer chess</p>
      </div>

      {lastError && (
        <div className="lobby__error" role="alert">
          {lastError}
          <button
            className="lobby__error-close"
            onClick={clearError}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <div className="lobby__cards">
        {/* Join Game */}
        <div className="lobby__card">
          <div className="lobby__card-icon">⚔️</div>
          <h2 className="lobby__card-title">Play</h2>
          <p className="lobby__card-desc">Enter matchmaking and find an opponent</p>
          <input
            className="lobby__input"
            placeholder="Your Player ID"
            value={playerIdInput}
            onChange={(e) => setPlayerIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
          />
          <button
            className="btn btn--primary"
            onClick={handleJoin}
            disabled={!playerIdInput.trim() || status === 'waiting'}
          >
            {status === 'waiting' ? (
              <span className="lobby__spinner">Finding opponent<span className="dots">...</span></span>
            ) : (
              'Find Match'
            )}
          </button>
        </div>

        {/* Spectate */}
        <div className="lobby__card">
          <div className="lobby__card-icon">👁</div>
          <h2 className="lobby__card-title">Spectate</h2>
          <p className="lobby__card-desc">Watch a live game in progress</p>
          <input
            className="lobby__input"
            placeholder="Your Spectator ID"
            value={spectatorId}
            onChange={(e) => setSpectatorId(e.target.value)}
          />
          <input
            className="lobby__input"
            placeholder="Game ID to spectate"
            value={spectateGameId}
            onChange={(e) => setSpectateGameId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSpectate()}
          />
          <button
            className="btn btn--secondary"
            onClick={handleSpectate}
            disabled={!spectateGameId.trim() || !spectatorId.trim()}
          >
            Spectate Game
          </button>
        </div>

        {/* Replay */}
        <div className="lobby__card">
          <div className="lobby__card-icon">🎬</div>
          <h2 className="lobby__card-title">Replay</h2>
          <p className="lobby__card-desc">Review a completed game move by move</p>
          <input
            className="lobby__input"
            placeholder="Game ID for replay"
            value={replayGameId}
            onChange={(e) => setReplayGameId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleReplay()}
          />
          <button
            className="btn btn--secondary"
            onClick={handleReplay}
            disabled={!replayGameId.trim() || replayLoading}
          >
            {replayLoading ? 'Loading…' : 'Load Replay'}
          </button>
        </div>
      </div>
    </div>
  );
};
