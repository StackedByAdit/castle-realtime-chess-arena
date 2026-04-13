import { WebSocketServer, WebSocket } from "ws";
import { GameManager } from "./gameManager.js";

const wss = new WebSocketServer({ port: 8080 });

const gameManager = new GameManager();

const playerToSocket = new Map<string, WebSocket>();
const socketToPlayer = new Map<WebSocket, string>();
const disconnectTimers = new Map<string, NodeJS.Timeout>();

const spectatorToSocket = new Map<string, WebSocket>();
const socketToSpectator = new Map<WebSocket, string>();

// Bug fixes #2, #3: New signature supplies ratingUpdate (so clients receive
// their post-timeout ratings) and spectatorIds captured before room deletion
// (so spectators are still notified even though the room is gone).
gameManager.setTimeoutHandler((gameId, winnerId, reason, ratingUpdate, spectatorIds) => {
    const replay = gameManager.getReplay(gameId);
    if (!replay) return;

    // Notify both players — include ratingUpdate (was null before, bug #2)
    replay.players.forEach((player) => {
        const client = playerToSocket.get(player.id);
        client?.send(JSON.stringify({
            type: "GAME_OVER",
            payload: {
                winner: winnerId,
                reason,
                ratings: ratingUpdate,
            },
        }));
    });

    // Notify spectators using the pre-captured list (bug #3 — room already deleted)
    spectatorIds.forEach((spectatorId) => {
        const client = spectatorToSocket.get(spectatorId);
        client?.send(JSON.stringify({
            type: "GAME_OVER",
            payload: { winner: winnerId, reason },
        }));
    });
});

wss.on("connection", (socket: WebSocket) => {
    console.log("New socket connected");

    socket.on("message", (data) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let message: any;
        try {
            message = JSON.parse(data.toString());
        } catch {
            console.error("Failed to parse WebSocket message");
            return;
        }

        // ── JOIN ─────────────────────────────────────────────────────────
        if (message.type === "JOIN") {
            const playerId: string = message.playerId;

            playerToSocket.set(playerId, socket);
            socketToPlayer.set(socket, playerId);

            console.log("Player connected:", playerId);

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
                        playerChat: gameManager.getPlayerChat(playerId),
                    },
                }));
                return;
            }

            const matchResult = gameManager.addPlayer(playerId);

            if (matchResult.status === "waiting") {
                socket.send(JSON.stringify({
                    type: "WAITING",
                    message: "Waiting for opponent...",
                }));
            }

            if (matchResult.status === "in_game") {
                socket.send(JSON.stringify({
                    type: "WAITING",
                    message: "Already in a game...",
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
                            opponent: players.find(p => p !== id),
                            gameId: matchResult.gameId,
                        },
                    }));
                });
            }
        }

        // ── SPECTATE ─────────────────────────────────────────────────────
        if (message.type === "SPECTATE") {
            const spectatorId: string = message.spectatorId;
            const gameId: string = message.gameId;

            spectatorToSocket.set(spectatorId, socket);
            socketToSpectator.set(socket, spectatorId);

            const result = gameManager.addSpectator(spectatorId, gameId);

            if (!result) {
                socket.send(JSON.stringify({
                    type: "ERROR",
                    payload: { message: "Game not found" },
                }));
                return;
            }

            // Bug #5: Include gameId in the payload so the client can store it.
            socket.send(JSON.stringify({
                type: "SPECTATING",
                payload: {
                    state: result.state,
                    spectatorChat: result.spectatorChat,
                    gameId,
                },
            }));
        }

        // ── MOVE ─────────────────────────────────────────────────────────
        if (message.type === "MOVE") {
            const playerId = socketToPlayer.get(socket);
            if (!playerId) return;

            const players = gameManager.getPlayersInGame(playerId);
            const spectatorGameId = gameManager.getGameIdByPlayer(playerId);
            const spectatorsSnapshot = spectatorGameId
                ? gameManager.getSpectatorsInGame(spectatorGameId)
                : [];

            const move: string = message.payload.move;
            const result = gameManager.handleMove(playerId, move);

            if (!result.success) {
                socket.send(JSON.stringify({
                    type: "ERROR",
                    payload: result,
                }));
                return;
            }

            const s = result;

            // Bug #6: Broadcast moves so the live move list stays up-to-date.
            const updatePayload = {
                fen: s.fen,
                turn: s.turn,
                isGameOver: s.isGameOver,
                whiteTime: s.whiteTime,
                blackTime: s.blackTime,
                moves: s.moves,
            };

            players.forEach((player) => {
                playerToSocket.get(player.id)?.send(JSON.stringify({
                    type: "GAME_UPDATE",
                    payload: updatePayload,
                }));
            });

            spectatorsSnapshot.forEach((spectatorId) => {
                spectatorToSocket.get(spectatorId)?.send(JSON.stringify({
                    type: "GAME_UPDATE",
                    payload: updatePayload,
                }));
            });

            if (s.isGameOver) {
                players.forEach((player) => {
                    playerToSocket.get(player.id)?.send(JSON.stringify({
                        type: "GAME_OVER",
                        payload: {
                            winner: s.winner,
                            reason: s.reason,
                            ratings: s.ratings,
                            pgn: s.pgn,
                        },
                    }));
                });

                spectatorsSnapshot.forEach((spectatorId) => {
                    spectatorToSocket.get(spectatorId)?.send(JSON.stringify({
                        type: "GAME_OVER",
                        payload: {
                            winner: s.winner,
                            reason: s.reason,
                            pgn: s.pgn,
                        },
                    }));
                });
            }
        }

        // ── PLAYER_CHAT ───────────────────────────────────────────────────
        if (message.type === "PLAYER_CHAT") {
            const playerId = socketToPlayer.get(socket);
            if (!playerId) return;

            const text: string = message.payload?.text?.trim();
            if (!text) return;

            const result = gameManager.sendPlayerChat(playerId, text);
            if (!result) return;

            const players = gameManager.getPlayersInGame(playerId);
            players.forEach((player) => {
                playerToSocket.get(player.id)?.send(JSON.stringify({
                    type: "PLAYER_CHAT",
                    payload: result.message,
                }));
            });
        }

        // ── SPECTATOR_CHAT ────────────────────────────────────────────────
        if (message.type === "SPECTATOR_CHAT") {
            const spectatorId = socketToSpectator.get(socket);
            if (!spectatorId) return;

            const text: string = message.payload?.text?.trim();
            if (!text) return;

            const result = gameManager.sendSpectatorChat(spectatorId, text);
            if (!result) return;

            const spectators = gameManager.getSpectatorsInGame(result.gameId);
            spectators.forEach((sid) => {
                spectatorToSocket.get(sid)?.send(JSON.stringify({
                    type: "SPECTATOR_CHAT",
                    payload: result.message,
                }));
            });
        }

        // ── GET_STATE ─────────────────────────────────────────────────────
        if (message.type === "GET_STATE") {
            const playerId = socketToPlayer.get(socket);
            if (!playerId) return;

            const state = gameManager.getGameState(playerId);

            socket.send(JSON.stringify({
                type: "GAME_STATE",
                payload: state,
            }));
        }

        // ── GET_REPLAY ────────────────────────────────────────────────────
        if (message.type === "GET_REPLAY") {
            const gameId: string = message.payload?.gameId;
            const game = gameManager.getReplay(gameId);

            // Bug #16: Send an explicit ERROR when a replay is not found so
            // the client can display feedback instead of silently doing nothing.
            if (!game) {
                socket.send(JSON.stringify({
                    type: "ERROR",
                    payload: { message: `Replay not found for game ID: ${gameId}` },
                }));
                return;
            }

            socket.send(JSON.stringify({
                type: "REPLAY_DATA",
                payload: game,
            }));
        }
    });

    socket.on("close", () => {
        // ── Spectator cleanup ─────────────────────────────────────────────
        const spectatorId = socketToSpectator.get(socket);
        if (spectatorId) {
            spectatorToSocket.delete(spectatorId);
            socketToSpectator.delete(socket);
            gameManager.removeSpectator(spectatorId);
            return;
        }

        // ── Player cleanup ────────────────────────────────────────────────
        const playerId = socketToPlayer.get(socket);
        if (!playerId) return;

        console.log("Player disconnected:", playerId);

        playerToSocket.delete(playerId);
        socketToPlayer.delete(socket);

        // Bug #13: Players not in an active game (waiting/idle) are cleaned
        // up immediately with no grace period since there is nothing to reconnect to.
        const isInGame = gameManager.getGameIdByPlayer(playerId) !== null;
        if (!isInGame) {
            gameManager.handleDisconnect(playerId);
            return;
        }

        const timeout = setTimeout(() => {
            console.log("Player did NOT reconnect:", playerId);

            const players = gameManager.getPlayersInGame(playerId);
            const opponent = players.find(p => p.id !== playerId);

            if (!opponent) {
                disconnectTimers.delete(playerId);
                return;
            }

            playerToSocket.get(opponent.id)?.send(JSON.stringify({
                type: "GAME_OVER",
                payload: {
                    winner: opponent.id,
                    reason: "opponent_disconnected",
                },
            }));

            gameManager.handleDisconnect(playerId);
            disconnectTimers.delete(playerId);
        }, 30000);

        disconnectTimers.set(playerId, timeout);
    });
});