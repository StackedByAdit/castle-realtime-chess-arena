import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../../context/GameStore';

export const MovesList: React.FC = () => {
  const moves = useGameStore((s) => s.moves);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves]);

  const pairs: Array<[string, string | undefined]> = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push([moves[i]!.san, moves[i + 1]?.san]);
  }

  return (
    <div className="moves-list" ref={scrollRef}>
      <div className="moves-list__header">Moves</div>
      {pairs.length === 0 ? (
        <div className="moves-list__empty">No moves yet</div>
      ) : (
        <div className="moves-list__grid">
          {pairs.map((pair, idx) => (
            <div key={idx} className="moves-list__row">
              <span className="moves-list__number">{idx + 1}.</span>
              <span className="moves-list__move moves-list__move--white">{pair[0]}</span>
              <span className="moves-list__move moves-list__move--black">{pair[1] ?? ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
