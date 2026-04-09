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
  status: "idle"
};
