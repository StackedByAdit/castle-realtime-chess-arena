import { create } from 'zustand';
import type { GameState, GameActions, ChatMessage, CompletedGame, Move, PlayerColor } from '../types/game';

const DEFAULT_TIME = 300;
const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState: GameState = {
  playerId: '',
  gameId: null,
  playerColor: null,
  opponentId: null,
  isSpectator: false,
  fen: STARTING_FEN,
  turn: 'w',
  status: 'idle',
  whiteTime: DEFAULT_TIME,
  blackTime: DEFAULT_TIME,
  isGameOver: false,
  winner: null,
  reason: null,
  ratings: null,
  pgn: null,
  moves: [],
  playerChat: [],
  spectatorChat: [],
  replayData: null,
  lastError: null,
};

export const useGameStore = create<GameState & GameActions>((set) => ({
  ...initialState,

  setPlayerId: (id: string) => set({ playerId: id }),

  setWaiting: () => set({ status: 'waiting', lastError: null }),

  setGameStart: (payload: { color: PlayerColor; opponent: string; gameId: string }) =>
    set({
      status: 'playing',
      playerColor: payload.color,
      opponentId: payload.opponent,
      gameId: payload.gameId,
      isSpectator: false,
      fen: STARTING_FEN,
      turn: 'w',
      whiteTime: DEFAULT_TIME,
      blackTime: DEFAULT_TIME,
      isGameOver: false,
      winner: null,
      reason: null,
      ratings: null,
      pgn: null,
      moves: [],
      playerChat: [],
      spectatorChat: [],
      lastError: null,
    }),

  // Bug #6: Now also updates the moves list so the live MovesList component
  // shows the current move history after every move.
  setGameUpdate: (payload) =>
    set({
      fen: payload.fen,
      turn: payload.turn,
      isGameOver: payload.isGameOver,
      whiteTime: payload.whiteTime,
      blackTime: payload.blackTime,
      moves: payload.moves,
    }),

  setGameOver: (payload) =>
    set({
      status: 'game_over',
      isGameOver: true,
      winner: payload.winner ?? null,
      reason: payload.reason ?? null,
      ratings: payload.ratings ?? null,
      pgn: payload.pgn ?? null,
    }),

  setReconnected: (payload) =>
    set({
      status: 'playing',
      fen: payload.fen,
      turn: payload.turn,
      isGameOver: payload.isGameOver,
      whiteTime: payload.whiteTime,
      blackTime: payload.blackTime,
      moves: payload.moves,
      playerChat: payload.playerChat,
      lastError: null,
    }),

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
  }) =>
    set({
      status: 'spectating',
      isSpectator: true,
      // Bug #5: gameId now comes from the server payload (not from stale store state)
      gameId: payload.gameId,
      fen: payload.state.fen,
      turn: payload.state.turn,
      isGameOver: payload.state.isGameOver,
      whiteTime: payload.state.whiteTime,
      blackTime: payload.state.blackTime,
      moves: payload.state.moves,
      spectatorChat: payload.spectatorChat,
      lastError: null,
    }),

  addPlayerChat: (msg: ChatMessage) =>
    set((state) => ({ playerChat: [...state.playerChat, msg] })),

  addSpectatorChat: (msg: ChatMessage) =>
    set((state) => ({ spectatorChat: [...state.spectatorChat, msg] })),

  setReplayData: (data: CompletedGame) => set({ replayData: data }),

  resetGame: () => set({ ...initialState }),

  // Bug #16: Error surfacing for things like "Replay not found"
  setError: (msg: string | null) => set({ lastError: msg }),
  clearError: () => set({ lastError: null }),
}));
