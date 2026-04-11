import { create } from "zustand";

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

  _replayData: unknown | null;
};

type GameStore = GameState & {
  setWaiting: () => void;

  setGameStart: (payload: {
    color: "w" | "b";
    opponent: string;
  }) => void;

  setGameUpdate: (payload: {
    fen: string;
    turn: "w" | "b";
    whiteTime: number;
    blackTime: number;
    isGameOver?: boolean;
  }) => void;

  setGameOver: (payload: {
    winner: string | null;
    reason: string | null;
    ratings?: Record<string, number>;
  }) => void;

  addPlayerChat: (msg: ChatMessage) => void;
  addSpectatorChat: (msg: ChatMessage) => void;

  setReconnected: (payload: {
    fen: string;
    turn: "w" | "b";
    whiteTime: number;
    blackTime: number;
    playerChat: ChatMessage[];
  }) => void;

  setSpectating: (payload: {
    state: {
      fen: string;
      turn: "w" | "b";
      whiteTime: number;
      blackTime: number;
    };
    spectatorChat: ChatMessage[];
  }) => void;

  setReplayData: (data: unknown) => void;

  reset: () => void;
};

const initialState: GameState = {
  fen: "start",
  turn: "w",

  whiteTime: 300,
  blackTime: 300,

  isGameOver: false,
  winner: null,
  reason: null,
  ratings: undefined,

  color: null,
  opponent: null,

  playerChat: [],
  spectatorChat: [],

  isSpectator: false,
  status: "idle",

  _replayData: null,
};

export const useGameStore = create<GameStore>((set) => ({
  ...initialState,

  setWaiting: () => set({ status: "waiting" }),

  setGameStart: ({ color, opponent }) =>
    set({
      status: "playing",
      color,
      opponent,
      isGameOver: false
    }),

  setGameUpdate: (payload) =>
    set((state) => ({
      ...state,
      fen: payload.fen,
      turn: payload.turn,
      whiteTime: payload.whiteTime,
      blackTime: payload.blackTime,
      ...(payload.isGameOver !== undefined && {
        isGameOver: payload.isGameOver
      })
    })),

  setGameOver: ({ winner, reason, ratings }) =>
    set({
      status: "finished",
      isGameOver: true,
      winner,
      reason,
      ratings
    }),

  addPlayerChat: (msg) =>
    set((state) => ({
      playerChat: [...state.playerChat, msg]
    })),

  addSpectatorChat: (msg) =>
    set((state) => ({
      spectatorChat: [...state.spectatorChat, msg]
    })),

  setReconnected: (payload) =>
    set({
      status: "playing",
      ...payload
    }),

  setSpectating: (payload) =>
    set({
      isSpectator: true,
      status: "playing",
      ...payload.state,
      spectatorChat: payload.spectatorChat
    }),

  setReplayData: (data) => set({ _replayData: data }),

  reset: () => set(initialState)
}));