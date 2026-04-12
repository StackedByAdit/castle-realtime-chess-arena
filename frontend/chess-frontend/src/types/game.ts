export type PlayerColor = "w" | "b";

export type ChatMessage = {
  senderId: string;
  text: string;
  timestamp: number;
};

export type GameSnapshot = {
  fen: string;
  turn: PlayerColor;
  whiteTime: number;
  blackTime: number;
  isGameOver?: boolean;
};

export type ReplayMove = {
  color: string;
  from: string;
  to: string;
  piece: string;
  san: string;
};

export type ReplayData = {
  gameId: string;
  players: Array<{ id: string; rating: number }>;
  pgn: string;
  moves: ReplayMove[];
  createdAt: number;
  result: {
    winner: string | null;
    reason: string | null;
  };
};
