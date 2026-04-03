import { WebSocket, WebSocketServer } from "ws";
import { GameManager } from "./gameManager.js";
import type { Player } from "./types.js";

const wss = new WebSocketServer({ port: 6969 });

const gameManager = new GameManager();


const clients = new Map<string, WebSocket>();
const queue: Player[] = [];

wss.on("connection", (socket: WebSocket) => {
    const socketId = Math.random().toString(36).slice(2);
    // console.log(socketId);

    clients.set(socketId, socket);
    console.log("connected: ", socketId);

    socket.on("message", (data) => {
        const message = JSON.parse(data.toString());

        if (message.type == "MOVE") {
            const move = message.playload.move;
            //socketId ~ playerId
            const result = gameManager.handleMove(socketId, move);

            if (!result.success) {
                socket.send(JSON.stringify(result));
                return;
            }
        }

        // for testing: auto-create game when 2 players connect
        // will remove it once i add the elo match making logic

    })
})

