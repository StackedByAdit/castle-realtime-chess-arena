type ChatMessage = {
  senderId: string;
  text: string;
  timestamp: number;
};

type GameState = {
  fen: string;
  turn: "w" | "b";

  whiteTime: number;
  blackTime: number;

  isGameOver: boolean;
  winner: string | null;
  reason: string | null;
  ratings?: Record<string, number>;

  color: "w" | "b" | null;
  opponent: string | null;

  playerChat: ChatMessage[];
  spectatorChat: ChatMessage[];

  isSpectator: boolean;
  status: "idle" | "waiting" | "playing" | "finished";
};


