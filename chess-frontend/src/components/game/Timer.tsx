import React from 'react';

interface TimerProps {
  seconds: number;
  isActive: boolean;
  label: string;
  color: 'w' | 'b';
}

export const Timer: React.FC<TimerProps> = ({ seconds, isActive, label, color }) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  const timeStr = `${m}:${s.toString().padStart(2, '0')}`;
  const isLow = seconds < 30;

  return (
    <div className={`timer ${isActive ? 'timer--active' : ''} ${isLow ? 'timer--low' : ''}`}>
      <div className="timer__color-dot" style={{ background: color === 'w' ? '#f0d9b5' : '#b58863' }} />
      <span className="timer__label">{label}</span>
      <span className="timer__time">{timeStr}</span>
    </div>
  );
};
