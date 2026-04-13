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
  // Identity
  playerId: string;
  gameId: string | null;
  playerColor: PlayerColor | null;
  opponentId: string | null;
  isSpectator: boolean;

  // Game
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

  // Chat
  playerChat: ChatMessage[];
  spectatorChat: ChatMessage[];

  // Replay
  replayData: CompletedGame | null;

  // Error feedback (bug #16)
  lastError: string | null;
};

export type GameActions = {
  setPlayerId: (id: string) => void;
  setWaiting: () => void;
  setGameStart: (payload: { color: PlayerColor; opponent: string; gameId: string }) => void;

  // Bug #6: setGameUpdate now includes moves so the live move list stays current
  setGameUpdate: (payload: {
    fen: string;
    turn: string;
    isGameOver: boolean;
    whiteTime: number;
    blackTime: number;
    moves: Move[];
  }) => void;

  setGameOver: (payload: {
    winner: string | null;
    reason: string | null;
    ratings?: Record<string, number>;
    pgn?: string;
  }) => void;

  setReconnected: (payload: {
    fen: string;
    turn: string;
    isGameOver: boolean;
    whiteTime: number;
    blackTime: number;
    moves: Move[];
    playerChat: ChatMessage[];
  }) => void;

  setSpectating: (payload: {
    state: {
      fen: string;
      turn: string;
      isGameOver: boolean;
      whiteTime: number;
      blackTime: number;
      moves: Move[];
    };
    spectatorChat: ChatMessage[];
    gameId: string;
  }) => void;

  addPlayerChat: (msg: ChatMessage) => void;
  addSpectatorChat: (msg: ChatMessage) => void;
  setReplayData: (data: CompletedGame) => void;
  resetGame: () => void;

  // Bug #16: Surface server errors (e.g. "Replay not found") to the UI
  setError: (msg: string | null) => void;
  clearError: () => void;
};
