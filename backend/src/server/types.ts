import type { Game } from "./Game.js";

export type Player = {
  id: string;
  rating: number;
}

export type CompletedGame = {
  gameId: string;
  players: Player[];
  pgn: string;
  moves: Move[];
  createdAt: number;
  result: {
    winner: string | null;
    reason: string | null;
  };
};

export type Move = {
  color: string;
  from: string;
  to: string;
  piece: string;
  san: string;
};

// Bug fix #6: Added `moves` field to the success variant so the server can
// broadcast the full move history with every GAME_UPDATE.
export type MoveResult =
  | {
    success: false;
    message: string;
  }
  | {
    success: true;
    isGameOver: boolean;
    winner: string | null;
    reason: string | null;
    fen: string;
    turn: string;
    whiteTime: number;
    blackTime: number;
    pgn: string;
    moves: Move[];
    ratings?: Record<string, number>;
  };

export type ChatMessage = {
  senderId: string;
  text: string;
  timestamp: number;
};

export type GameRoom = {
  game: Game;
  players: Player[];
  spectators: string[];
  playerChat: ChatMessage[];
  spectatorChat: ChatMessage[];
};