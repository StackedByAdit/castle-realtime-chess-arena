let _socket: WebSocket | null = null;

export function registerSocket(ws: WebSocket) {
    _socket = ws;
}

export function unregisterSocket() {
    _socket = null;
}

export function send(payload: object) {
    if (_socket && _socket.readyState === WebSocket.OPEN) {
        _socket.send(JSON.stringify(payload));
    } else {
        console.warn("[socket] send called but socket is not open", payload);
    }
}

export const socketActions = {
    join(playerId: string) {
        send({ type: "JOIN", playerId });
    },


    move(move: string) {
        send({ type: "MOVE", payload: { move } });
    },

    spectate(spectatorId: string, gameId: string) {
        send({ type: "SPECTATE", spectatorId, gameId });
    },

    playerChat(text: string) {
        send({ type: "PLAYER_CHAT", payload: { text } });
    },

    spectatorChat(text: string) {
        send({ type: "SPECTATOR_CHAT", payload: { text } });
    },

    getState() {
        send({ type: "GET_STATE" });
    },

    getReplay(gameId: string) {
        send({ type: "GET_REPLAY", payload: { gameId } });
    },
};