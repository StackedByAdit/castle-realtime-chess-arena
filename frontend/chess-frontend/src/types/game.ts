export type Player = {
  id: string;
  rating: number;
};

export type Move = {
  color: string;
  from: string;
  to: string;
  piece: string;
  san: string;
};

export type ChatMessage = {
  senderId: string;
  text: string;
  timestamp: number;
};

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

export type GameStatus =
  | 'idle'
  | 'waiting'
  | 'playing'
  | 'spectating'
  | 'game_over';

export type PlayerColor = 'w' | 'b';

export type GameState = {
  playerId: string;
  gameId: string | null;
  playerColor: PlayerColor | null;
  opponentId: string | null;
  isSpectator: boolean;

  fen: string;
  turn: string;
  status: GameStatus;
  whiteTime: number;
  blackTime: number;
  isGameOver: boolean;
  winner: string | null;
  reason: string | null;
  ratings: Record<string, number> | null;
  pgn: string | null;
  moves: Move[];

  playerChat: ChatMessage[];
  spectatorChat: ChatMessage[];

  replayData: CompletedGame | null;

  lastError: string | null;
};

export type GameActions = {
  setPlayerId: (id: string) => void;
  setWaiting: () => void;
  setGameStart: (payload: { color: PlayerColor; opponent: string; gameId: string }) => void;

  setGameUpdate: (payload: {
    fen: string;
    turn: string;
    isGameOver: boolean;
    whiteTime: number;
    blackTime: number;
    moves: Move[];
  }) => void;

};
