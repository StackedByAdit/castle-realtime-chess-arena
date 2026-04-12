import React, { useState, useEffect } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess } from 'chess.js';
import { useGameStore } from '../context/GameStore';

interface ReplayPageProps {
  onBack: () => void;
}

export const ReplayPage: React.FC<ReplayPageProps> = ({ onBack }) => {
  const replayData = useGameStore((s) => s.replayData);
  const [moveIndex, setMoveIndex] = useState(0);
  const [fen, setFen] = useState('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');

  useEffect(() => {
    if (!replayData) return;
    const chess = new Chess();
    const moves = replayData.moves.slice(0, moveIndex);
    for (const move of moves) {
      try {
        chess.move({ from: move.from, to: move.to });
      } catch {
        break;
      }
    }
    setFen(chess.fen());
  }, [moveIndex, replayData]);

  if (!replayData) {
    return (
      <div className="replay-page">
        <div className="replay-page__empty">
          <p>No replay data loaded yet.</p>
          <button className="btn btn--secondary" onClick={onBack}>← Back to Lobby</button>
        </div>
      </div>
    );
  }

  const totalMoves = replayData.moves.length;
  const pairs: Array<[string, string | undefined]> = [];
  for (let i = 0; i < replayData.moves.length; i += 2) {
    pairs.push([replayData.moves[i]!.san, replayData.moves[i + 1]?.san]);
  }

  const winner = replayData.result.winner;
  const reason = replayData.result.reason;

  return (
    <div className="replay-page">
      <div className="replay-page__header">
        <button className="btn btn--ghost" onClick={onBack}>← Back</button>
        <h2 className="replay-page__title">
          Game Replay
          {winner && <span className="replay-page__result"> — {winner.slice(0, 8)}... wins ({reason})</span>}
        </h2>
        <span className="replay-page__players">
          {replayData.players.map(p => p.id.slice(0, 8) + '...').join(' vs ')}
        </span>
      </div>

      <div className="replay-page__body">
        <div className="replay-page__board-col">
          <Chessboard
            position={fen}
            arePiecesDraggable={false}
            customDarkSquareStyle={{ backgroundColor: '#b58863' }}
            customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
            customBoardStyle={{ borderRadius: '4px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          />

          <div className="replay-controls">
            <button className="replay-btn" onClick={() => setMoveIndex(0)} disabled={moveIndex === 0}>⏮</button>
            <button className="replay-btn" onClick={() => setMoveIndex(i => Math.max(0, i - 1))} disabled={moveIndex === 0}>◀</button>
            <span className="replay-controls__counter">{moveIndex} / {totalMoves}</span>
            <button className="replay-btn" onClick={() => setMoveIndex(i => Math.min(totalMoves, i + 1))} disabled={moveIndex === totalMoves}>▶</button>
            <button className="replay-btn" onClick={() => setMoveIndex(totalMoves)} disabled={moveIndex === totalMoves}>⏭</button>
          </div>
        </div>

        <div className="replay-page__side">
          <div className="moves-list">
            <div className="moves-list__header">Move History</div>
            <div className="moves-list__grid">
              {pairs.map((pair, idx) => (
                <div key={idx} className={`moves-list__row ${moveIndex >= idx * 2 + 1 ? 'moves-list__row--done' : ''}`}>
                  <span className="moves-list__number">{idx + 1}.</span>
                  <span
                    className={`moves-list__move moves-list__move--white ${moveIndex === idx * 2 + 1 ? 'moves-list__move--current' : ''}`}
                    onClick={() => setMoveIndex(idx * 2 + 1)}
                  >{pair[0]}</span>
                  <span
                    className={`moves-list__move moves-list__move--black ${pair[1] && moveIndex === idx * 2 + 2 ? 'moves-list__move--current' : ''}`}
                    onClick={() => pair[1] && setMoveIndex(idx * 2 + 2)}
                  >{pair[1] ?? ''}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
