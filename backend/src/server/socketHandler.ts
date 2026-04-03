import { WebSocket, WebSocketServer } from "ws";
import { GameManager } from "./gameManager.js";

const wss = new WebSocketServer({ port: 6969 });

const gameManager = new GameManager();


const clients = new Map<string, WebSocket>();
const queue: string[] = [];

wss.on("connection", (socket: WebSocket) => {
    const socketId = Math.random().toString(36).slice(2);
    // console.log(socketId);

    clients.set(socketId, socket);
    console.log("connected: ", socketId);

    socket.on("message", (data) => {
        const message = JSON.parse(data.toString());

        if (message.type == " MOVE") {
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
        if (queue.length >= 2) {
            const player1 = queue.shift()!;
            const player2 = queue.shift()!;

            const gameId = gameManager.createGame(player1, player2);

            console.log("Game created:", gameId);

            

            
        }


    })
})

