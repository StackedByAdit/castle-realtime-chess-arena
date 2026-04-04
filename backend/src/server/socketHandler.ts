import { WebSocketServer, WebSocket } from "ws";
import { GameManager } from "./gameManager.js";

const wss = new WebSocketServer({ port: 8080 });

const gameManager = new GameManager();

const playerToSocket = new Map<string, WebSocket>();
const socketToPlayer = new Map<WebSocket, string>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();

wss.on("connection", (socket: WebSocket) => {

    console.log("New socket connected");

    socket.on("message", (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === "JOIN") {  // frintend will send type and payload //its like custom message contract
            const playerId = message.playerId;

            playerToSocket.set(playerId, socket);
            socketToPlayer.set(socket, playerId);

            console.log("Player connected:", playerId);

            // cancel disconnect timer if reconnect
            if (disconnectTimers.has(playerId)) {
                clearTimeout(disconnectTimers.get(playerId)!);
                disconnectTimers.delete(playerId);
                console.log("Reconnected:", playerId);
            }

            const existingGame = gameManager.getGameState(playerId);

            if (existingGame) {
                socket.send(JSON.stringify({
                    type: "RECONNECTED",
                    payload: existingGame
                }));
                return;
            }

            const matchResult = gameManager.addPlayer(playerId);

            if (matchResult.status === "waiting") {
                socket.send(JSON.stringify({
                    type: "WAITING",
                    message: "Waiting for opponent..."
                }));
            }

            if (matchResult.status === "matched" && "players" in matchResult) {
                const players = matchResult.players;

                players.forEach((id, index) => {
                    const client = playerToSocket.get(id);

                    client?.send(JSON.stringify({
                        type: "GAME_START",
                        payload: {
                            color: index === 0 ? "w" : "b",
                            opponent: players.find(p => p !== id)
                        }
                    }));
                });
            }
        }

        if (message.type === "MOVE") {
            const playerId = socketToPlayer.get(socket);
            if (!playerId) return;

            const move = message.payload.move;

            const result = gameManager.handleMove(playerId, move);

            if (!result.success) {
                socket.send(JSON.stringify({
                    type: "ERROR",
                    payload: result
                }));
                return;
            }

            const players = gameManager.getPlayersInGame(playerId);

            players.forEach((player) => {
                const client = playerToSocket.get(player.id);

                client?.send(JSON.stringify({
                    type: "GAME_UPDATE",
                    payload: {
                        fen: result.fen,
                        turn: result.turn,
                        isGameOver: result.isGameOver,
                        whiteTime: result.whiteTime,
                        blackTime: result.blackTime
                    }
                }));
            });

            if (result.isGameOver) {
                players.forEach((player) => {
                    const client = playerToSocket.get(player.id);

                    client?.send(JSON.stringify({
                        type: "GAME_OVER",
                        payload: {
                            winner: result.winner,
                            reason: result.reason,
                            ratings: result.ratings,
                            pgn: result.pgn
                        }
                    }));
                });
            }
        }

        if (message.type === "GET_STATE") {
            const playerId = socketToPlayer.get(socket);
            if (!playerId) return;

            const state = gameManager.getGameState(playerId);

            socket.send(JSON.stringify({
                type: "GAME_STATE",
                payload: state
            }));
        }
    });

});