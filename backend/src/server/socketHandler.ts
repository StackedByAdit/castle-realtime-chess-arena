import { WebSocket, WebSocketServer } from "ws";
import { GameManager } from "./gameManager";


const wss = new WebSocketServer({port : 6969});

const gameManager = new GameManager();

wss.on("connection", (socket : WebSocket) => {
    const socketId = Math.random().toString();
    console.log(socketId);
})

