import React, { useState } from 'react';
import { useGame } from '../hooks/useGame';
import { useSocket } from '../hooks/useSocket';

interface LobbyPageProps {
  onNavigateToGame: () => void;
}

export const LobbyPage: React.FC<LobbyPageProps> = ({ onNavigateToGame }) => {
  const [playerIdInput, setPlayerIdInput] = useState('');
  const [spectateGameId, setSpectateGameId] = useState('');
  const [spectatorId, setSpectatorId] = useState('');
  const [replayGameId, setReplayGameId] = useState('');
  const { status } = useGame();
  const { joinGame, spectateGame, getReplay } = useSocket();

  const handleJoin = () => {
    if (!playerIdInput.trim()) return;
    joinGame(playerIdInput.trim());
    onNavigateToGame();
  };

  const handleSpectate = () => {
    if (!spectateGameId.trim() || !spectatorId.trim()) return;
    spectateGame(spectatorId.trim(), spectateGameId.trim());
    onNavigateToGame();
  };

  const handleReplay = () => {
    if (!replayGameId.trim()) return;
    getReplay(replayGameId.trim());
  };

  return (
    <div className="lobby">
      <div className="lobby__header">
        <div className="lobby__logo">♛</div>
        <h1 className="lobby__title">Castle</h1>
        <p className="lobby__sub">Real-time multiplayer chess</p>
      </div>

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
            disabled={!replayGameId.trim()}
          >
            Load Replay
          </button>
        </div>
      </div>
    </div>
  );
};
