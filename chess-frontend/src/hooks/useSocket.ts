import { useEffect } from 'react';
import { socketService } from '../services/socket';
import { useGameStore } from '../context/GameStore';
import type { Move, ChatMessage, CompletedGame } from '../types/game';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8080';

/**
 * Initialises the WebSocket connection and registers the centralised message
 * handler. Call this EXACTLY ONCE at the top of the component tree (App.tsx).
 *
 * Bug #10: Previously called in App, LobbyPage, and GamePage simultaneously,
 * causing three duplicate handlers to be registered. Now only App calls this.
 * Components that only need to send messages should use useSocketActions().
 *
 * Bug #25: Using useGameStore.getState() inside the effect avoids stale
 * closures and makes the empty dependency array genuinely correct.
 */
export function useSocket() {
  useEffect(() => {
    socketService.connect(WS_URL);

    const unsub = socketService.onMessage((data) => {
      // Bug #25 fix: getState() always reads the current store — no stale closure.
      const store = useGameStore.getState();
      const msg = data as { type: string; payload?: Record<string, unknown> };

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
          // Bug #6: moves now included in the payload
          const p = msg.payload as {
            fen: string;
            turn: string;
            isGameOver: boolean;
            whiteTime: number;
            blackTime: number;
            moves: Move[];
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
          // Bug #23 fix: properly typed Move[] and ChatMessage[] instead of never[]
          const p = msg.payload as {
            fen: string;
            turn: string;
            isGameOver: boolean;
            whiteTime: number;
            blackTime: number;
            moves: Move[];
            playerChat: ChatMessage[];
          };
          store.setReconnected(p);
          break;
        }

        case 'SPECTATING': {
          // Bug #5: gameId is now sent by the server inside the payload;
          // we no longer fall back to the stale store.gameId.
          const p = msg.payload as {
            state: {
              fen: string;
              turn: string;
              isGameOver: boolean;
              whiteTime: number;
              blackTime: number;
              moves: Move[];
            };
            spectatorChat: ChatMessage[];
            gameId: string;
          };
          store.setSpectating(p);
          break;
        }

        case 'PLAYER_CHAT': {
          const p = msg.payload as ChatMessage;
          store.addPlayerChat(p);
          break;
        }

        case 'SPECTATOR_CHAT': {
          const p = msg.payload as ChatMessage;
          store.addSpectatorChat(p);
          break;
        }

        case 'REPLAY_DATA': {
          // Bug #22 fix: typed as CompletedGame instead of any
          const p = msg.payload as CompletedGame | undefined;
          if (p) store.setReplayData(p);
          break;
        }

        case 'ERROR': {
          // Bug #16: Surface server errors (e.g. "Replay not found") in the UI
          const p = msg.payload as { message: string };
          store.setError(p.message);
          break;
        }

        default:
          break;
      }
    });

    return () => {
      unsub();
    };
  }, []); // Empty deps is correct — getState() avoids any stale closure issue
}
