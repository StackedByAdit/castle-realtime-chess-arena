import { useEffect } from 'react';
import { socketService } from '../services/socket';
import { useGameStore } from '../context/GameStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

export function useSocket() {
  const store = useGameStore();

  useEffect(() => {
    socketService.connect(WS_URL);

    const unsub = socketService.onMessage((data) => {
      const msg = data as { type: string; payload?: Record<string, unknown>; message?: string };

      switch (msg.type) {
        case 'WAITING':
          store.setWaiting();
          break;

        case 'GAME_START': {
          const p = msg.payload as { color: 'w' | 'b'; opponent: string; gameId: string };
          store.setGameStart({ color: p.color, opponent: p.opponent, gameId: p.gameId });
          break;
        }

        case 'GAME_UPDATE': {
          const p = msg.payload as {
            fen: string;
            turn: string;
            isGameOver: boolean;
            whiteTime: number;
            blackTime: number;
          };
          store.setGameUpdate(p);
          break;
        }

        case 'GAME_OVER': {
          const p = msg.payload as {
            winner: string | null;
            reason: string | null;
            ratings?: Record<string, number>;
            pgn?: string;
          };
          store.setGameOver(p);
          break;
        }

        case 'RECONNECTED': {
          const p = msg.payload as {
            fen: string;
            turn: string;
            isGameOver: boolean;
            whiteTime: number;
            blackTime: number;
            moves: [];
            playerChat: [];
          };
          store.setReconnected(p);
          break;
        }

        case 'SPECTATING': {
          const p = msg.payload as {
            state: {
              fen: string;
              turn: string;
              isGameOver: boolean;
              whiteTime: number;
              blackTime: number;
              moves: [];
            };
            spectatorChat: [];
            gameId: string;
          };
          store.setSpectating({ ...p, gameId: store.gameId || '' });
          break;
        }

        case 'PLAYER_CHAT': {
          const p = msg.payload as { senderId: string; text: string; timestamp: number };
          store.addPlayerChat(p);
          break;
        }

        case 'SPECTATOR_CHAT': {
          const p = msg.payload as { senderId: string; text: string; timestamp: number };
          store.addSpectatorChat(p);
          break;
        }

        case 'REPLAY_DATA': {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const p = msg.payload as any;
          if (p) store.setReplayData(p);
          break;
        }

        default:
          break;
      }
    });

    return () => {
      unsub();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinGame = (playerId: string) => {
    store.setPlayerId(playerId);
    socketService.send({ type: 'JOIN', playerId });
  };

  const makeMove = (move: string) => {
    socketService.send({ type: 'MOVE', payload: { move } });
  };

  const sendPlayerChat = (text: string) => {
    socketService.send({ type: 'PLAYER_CHAT', payload: { text } });
  };

  const sendSpectatorChat = (text: string) => {
    socketService.send({ type: 'SPECTATOR_CHAT', payload: { text } });
  };

  const spectateGame = (spectatorId: string, gameId: string) => {
    socketService.send({ type: 'SPECTATE', spectatorId, gameId });
  };

  const getState = () => {
    socketService.send({ type: 'GET_STATE' });
  };

  const getReplay = (gameId: string) => {
    socketService.send({ type: 'GET_REPLAY', payload: { gameId } });
  };

  return {
    joinGame,
    makeMove,
    sendPlayerChat,
    sendSpectatorChat,
    spectateGame,
    getState,
    getReplay,
  };
}
