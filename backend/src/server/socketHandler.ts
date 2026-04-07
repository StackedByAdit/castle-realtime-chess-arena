import { WebSocketServer, WebSocket } from "ws";
import { GameManager } from "./gameManager.js";

const wss = new WebSocketServer({ port: 8080 });

const gameManager = new GameManager();

const playerToSocket = new Map<string, WebSocket>();
const socketToPlayer = new Map<WebSocket, string>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();

const spectatorToSocket = new Map<string, WebSocket>();
const socketToSpectator = new Map<WebSocket, string>();

gameManager.setTimeoutHandler((gameId, winnerId, reason) => {
    const replay = gameManager.getReplay(gameId);
    if (!replay) return;

    // notify both players
    replay.players.forEach((player) => {
        const client = playerToSocket.get(player.id);

        client?.send(JSON.stringify({
            type: "GAME_OVER",
            payload: {
                winner: winnerId,
                reason,
                ratings: null
            }
        }));
    });

    const spectators = gameManager.getSpectatorsInGame(gameId);
    spectators.forEach((spectatorId) => {
        const client = spectatorToSocket.get(spectatorId);

        client?.send(JSON.stringify({
            type: "GAME_OVER",
            payload: {
                winner: winnerId,
                reason
            }
        }));
    });
});

wss.on("connection", (socket: WebSocket) => {

    console.log("New socket connected");

    socket.on("message", (data) => {
        const message = JSON.parse(data.toString());

        if (message.type === "JOIN") { 
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
                    payload: {
                        ...existingGame,
                        playerChat: gameManager.getPlayerChat(playerId)
                    }
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

            if (matchResult.status === "in_game") {
                socket.send(JSON.stringify({
                    type: "WAITING",
                    message: "Already in a game..."
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

            const players = gameManager.getPlayersInGame(playerId);

            const move = message.payload.move;
            const result = gameManager.handleMove(playerId, move);

            if (!result.success) {
                socket.send(JSON.stringify({
                    type: "ERROR",
                    payload: result
                }));
                return;
            }

            const successResult = result;

            players.forEach((player) => {
                const client = playerToSocket.get(player.id);

                client?.send(JSON.stringify({
                    type: "GAME_UPDATE",
                    payload: {
                        fen: successResult.fen,
                        turn: successResult.turn,
                        isGameOver: successResult.isGameOver,
                        whiteTime: successResult.whiteTime,
                        blackTime: successResult.blackTime
                    }
                }));
            });

            if (successResult.isGameOver) {
                players.forEach((player) => {
                    const client = playerToSocket.get(player.id);

                    client?.send(JSON.stringify({
                        type: "GAME_OVER",
                        payload: {
                            winner: successResult.winner,
                            reason: successResult.reason,
                            ratings: successResult.ratings,
                            pgn: successResult.pgn
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

        if (message.type === "GET_REPLAY") {
            const gameId = message.payload.gameId;

            const game = gameManager.getReplay(gameId);

            socket.send(JSON.stringify({
                type: "REPLAY_DATA",
                payload: game
            }));
        }
    });

    socket.on("close", () => {
        const playerId = socketToPlayer.get(socket);
        if (!playerId) return;

        console.log("Player disconnected:", playerId);

        playerToSocket.delete(playerId);
        socketToPlayer.delete(socket);

        const timeout = setTimeout(() => {
            console.log("Player did NOT reconnect:", playerId);

            const players = gameManager.getPlayersInGame(playerId);

            const opponent = players.find(p => p.id !== playerId);
            if (!opponent) return;

            const opponentSocket = playerToSocket.get(opponent.id);

            opponentSocket?.send(JSON.stringify({
                type: "GAME_OVER",
                payload: {
                    winner: opponent.id,
                    reason: "opponent_disconnected"
                }
            }));

            gameManager.handleDisconnect(playerId);

            disconnectTimers.delete(playerId);

        }, 30000);

        disconnectTimers.set(playerId, timeout);
    });
});