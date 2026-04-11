import { useEffect, useRef } from "react";
import { useGameStore } from "../context/GameContext";
import { registerSocket, unregisterSocket } from "../services/socket";

export const useSocket = () => {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const socket = new WebSocket("ws://localhost:8080");

    socket.onopen = () => {
      console.log("Connected to server");
      registerSocket(socket); 
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      const store = useGameStore.getState();

      switch (data.type) {
        case "WAITING":
          store.setWaiting();
          break;

        case "GAME_START":
          store.setGameStart(data.payload);
          break;

        case "GAME_UPDATE":
          store.setGameUpdate(data.payload);
          break;

        case "GAME_OVER":
          store.setGameOver(data.payload);
          break;

        case "PLAYER_CHAT":
          store.addPlayerChat(data.payload);
          break;

        case "SPECTATOR_CHAT":
          store.addSpectatorChat(data.payload);
          break;

        case "RECONNECTED":
          store.setReconnected(data.payload);
          break;

        case "SPECTATING":
          store.setSpectating(data.payload);
          break;

        case "GAME_STATE":
          store.setGameUpdate(data.payload);
          break;

        default:
          console.log("Unknown event:", data.type);
      }
    };

    socket.onclose = () => {
      console.log("Disconnected");
      unregisterSocket();
    };

    socketRef.current = socket;

    return () => {
      socket.close();
      unregisterSocket();
    };
  }, []);

  return socketRef;
};