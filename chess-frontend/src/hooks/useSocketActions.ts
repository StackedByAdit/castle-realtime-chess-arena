import { socketService } from '../services/socket';
import { useGameStore } from '../context/GameStore';

/**
 * Provides WebSocket action functions WITHOUT registering message handlers.
 *
 * Bug #10: useSocket() used to be called in App, LobbyPage, GamePage, and
 * ChessBoard, creating 3–4 duplicate message handlers simultaneously.
 * This hook contains only the send-side actions, so it is safe to call in
 * any number of components without any handler side-effects.
 */
export function useSocketActions() {
  const setPlayerId = useGameStore((s) => s.setPlayerId);

  const joinGame = (playerId: string) => {
    setPlayerId(playerId);
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
