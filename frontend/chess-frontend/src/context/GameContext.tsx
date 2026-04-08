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

type Action =
    | {
        type: "WAITING"
    }
    | {
        type: "GAME_START"; payload: {
            color: "w" | "b"; opponent: string

        }
    }
    | {
        type: "GAME_UPDATE";
        payload: {
            fen: string;
            turn: "w" | "b";
            whiteTime: number;
            blackTime: number;
            isGameOver: boolean;
        };
    }
    | {
        type: "GAME_OVER";
        payload: {
            winner: string | null;
            reason: string | null;
            ratings?: Record<string, number>;
        };
    }
    | {
        type: "PLAYER_CHAT"; payload: ChatMessage
    }
    | {
        type: "SPECTATOR_CHAT"; payload: ChatMessage
    }
    | {
        type: "RECONNECTED";
        payload: {
            fen: string;
            turn: "w" | "b";
            whiteTime: number;
            blackTime: number;
            playerChat: ChatMessage[];
        };
    }
    | {
        type: "SPECTATING";
        payload: {
            state: {
                fen: string;
                turn: "w" | "b";
                whiteTime: number;
                blackTime: number;
            };
            spectatorChat: ChatMessage[];
        };
    }
    | {
        type: "GAME_STATE";
        payload: {
            fen: string;
            turn: "w" | "b";
            whiteTime: number;
            blackTime: number;
        };
    }
    | { type: "RESET" };

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

function reducer(state: GameState, action: Action): GameState {
    switch (action.type) {

        case "WAITING":
            return { ...state, status: "waiting" };

        case "GAME_START":
            return {
                ...state,
                status: "playing",
                color: action.payload.color,
                opponent: action.payload.opponent,
                isGameOver: false
            };

        case "GAME_UPDATE":
            return {
                ...state,
                fen: action.payload.fen,
                turn: action.payload.turn,
                whiteTime: action.payload.whiteTime,
                blackTime: action.payload.blackTime,
                isGameOver: action.payload.isGameOver
            };

        case "GAME_STATE":
            return {
                ...state,
                fen: action.payload.fen,
                turn: action.payload.turn,
                whiteTime: action.payload.whiteTime,
                blackTime: action.payload.blackTime
            };

        case "GAME_OVER":
            return {
                ...state,
                status: "finished",
                isGameOver: true,
                ...action.payload
            };

        case "PLAYER_CHAT":
            return {
                ...state,
                playerChat: [...state.playerChat, action.payload]
            };

        case "SPECTATOR_CHAT":
            return {
                ...state,
                spectatorChat: [...state.spectatorChat, action.payload]
            };

        case "RECONNECTED":
            return {
                ...state,
                status: "playing",
                ...action.payload
            };

        case "SPECTATING":
            return {
                ...state,
                isSpectator: true,
                status: "playing",
                ...action.payload.state,
                spectatorChat: action.payload.spectatorChat
            };

        case "RESET":
            return initialState;

        default:
            return state;
    }
}