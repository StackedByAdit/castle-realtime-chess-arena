import { WebSocketServer, WebSocket } from "ws";
import { GameManager } from "./gameManager.js";

const wss = new WebSocketServer({ port: 8080 });

const gameManager = new GameManager();

const clients = new Map<string, WebSocket>();

wss.on("connection", (socket: WebSocket) => {
    const socketId = Math.random().toString(36).slice(2);

    clients.set(socketId, socket);
    console.log("User connected:", socketId);

    const matchResult = gameManager.addPlayer(socketId);

    if (matchResult.status === "waiting") {
        socket.send(JSON.stringify({
            type: "WAITING",
            message: "Waiting for opponent..."
        }));
    }

    if (matchResult.status === "matched" && "players" in matchResult) {
        const players = matchResult.players;

        players.forEach((playerId, index) => {
            const client = clients.get(playerId);

            client?.send(JSON.stringify({
                type: "GAME_START",
                payload: {
                    color: index === 0 ? "w" : "b",
                    opponent: players.find(p => p !== playerId)
                }
            }));
        });
    }

    socket.on("message", (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === "MOVE") {
            const move = message.payload.move;

            const result = gameManager.handleMove(socketId, move);

            if (!result.success) {
                socket.send(JSON.stringify({
                    type: "ERROR",
                    payload: result
                }));
                return;
            }
            const players = gameManager.getPlayersInGame(socketId);

            players.forEach((player) => {
                const client = clients.get(player.id);

                client?.send(JSON.stringify({
                    type: "GAME_UPDATE",
                    payload: {
                        fen: result.fen,
                        turn: result.turn,
                        isGameOver: result.isGameOver
                    }
                }));
            });

            if (result.isGameOver) {
                players.forEach((player) => {
                    const client = clients.get(player.id);

                    client?.send(JSON.stringify({
                        type: "GAME_OVER",
                        payload: {
                            message: "Game finished"
                        }
                    }));
                });
            }
        }

        if (message.type === "GET_STATE") {
            const state = gameManager.getGameState(socketId);

            socket.send(JSON.stringify({
                type: "GAME_STATE",
                payload: state
            }));
        }
    });

    socket.on("close", () => {
        clients.delete(socketId);
        console.log("User disconnected:", socketId);
    });
});