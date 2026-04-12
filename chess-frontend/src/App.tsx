import React, { useEffect, useState } from 'react';
import { LobbyPage } from './pages/LobbyPage';
import { GamePage } from './pages/GamePage';
import { ReplayPage } from './pages/ReplayPage';
import { useGameStore } from './context/GameStore';
import { useSocket } from './hooks/useSocket';

type Page = 'lobby' | 'game' | 'replay';

const App: React.FC = () => {
  const [page, setPage] = useState<Page>('lobby');
  const status = useGameStore((s) => s.status);
  const replayData = useGameStore((s) => s.replayData);
  const resetGame = useGameStore((s) => s.resetGame);

  // Initialize socket on app load
  useSocket();

  // Auto-navigate when game starts or spectating
  useEffect(() => {
    if (status === 'playing' || status === 'spectating') {
      setPage('game');
    }
  }, [status]);

  // Auto-navigate when replay data is loaded
  useEffect(() => {
    if (replayData) {
      setPage('replay');
    }
  }, [replayData]);

  const handleReturnToLobby = () => {
    resetGame();
    setPage('lobby');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__brand" onClick={handleReturnToLobby}>
          ♛ <span>Castle</span>
        </div>
        <nav className="app-header__nav">
          {page !== 'lobby' && (
            <button className="btn btn--ghost" onClick={handleReturnToLobby}>
              ← Lobby
            </button>
          )}
          {status === 'playing' && page === 'lobby' && (
            <button className="btn btn--ghost" onClick={() => setPage('game')}>
              Return to Game
            </button>
          )}
        </nav>
      </header>

      <main className="app-main">
        {page === 'lobby' && <LobbyPage onNavigateToGame={() => setPage('game')} />}
        {page === 'game' && <GamePage onReturnToLobby={handleReturnToLobby} />}
        {page === 'replay' && <ReplayPage onBack={handleReturnToLobby} />}
      </main>
    </div>
  );
};

export default App;
