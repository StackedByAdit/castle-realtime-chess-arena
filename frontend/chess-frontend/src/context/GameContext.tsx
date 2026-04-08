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
