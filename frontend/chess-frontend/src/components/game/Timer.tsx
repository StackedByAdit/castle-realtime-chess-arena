import React from "react";

type Props = {
  playerId: string;
  timeSeconds: number;
  isActive: boolean;
  color: "w" | "b";
  isBottom: boolean;
};

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export default function Timer({ playerId, timeSeconds, isActive, color, isBottom }: Props) {
  const isLow = timeSeconds <= 30;
  const isDead = timeSeconds === 0;

  return (
    <div className={`player-bar ${isActive ? "active" : ""} ${isBottom ? "bottom" : "top"}`}>
      <div className="player-info">
        <span className="player-color-pip" data-color={color} />
        <span className="player-name">{playerId}</span>
      </div>
      <div className={`player-clock ${isActive ? "ticking" : ""} ${isLow ? "low" : ""} ${isDead ? "dead" : ""}`}>
        {fmt(timeSeconds)}
      </div>
    </div>
  );
}