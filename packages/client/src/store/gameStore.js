import { io } from 'socket.io-client';
import { SocketEvents, Phase } from '@ma-soi/shared';
import { create } from 'zustand';
export const useGameStore = create((set, get) => ({
  socket: null,
  connected: false,
  gameState: null,
  events: [],
  spectatorMode: 'god',
  playerViewState: null,
  playerViewId: null,
  tokenUsage: null,
  view: 'lobby',
  connect() {
    // Guard against double invocation (React StrictMode in dev)
    const existing = get().socket;
    if (existing) {
      existing.disconnect();
    }
    const bePort = import.meta.env.VITE_BE_PORT || '3001';
    const socket = io(
      window.location.hostname === 'localhost' ? `http://localhost:${bePort}` : '/',
      { transports: ['websocket', 'polling'] },
    );
    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));
    socket.on(SocketEvents.GAME_STATE, (state) => {
      set({ gameState: state, events: state.events });
      if (state.phase !== Phase.Lobby && state.phase !== Phase.GameOver) {
        set({ view: 'game' });
      }
    });
    socket.on(SocketEvents.GAME_EVENT, (event) => {
      set((s) => {
        // Deduplicate: skip if this event timestamp already exists
        if (s.events.some((e) => e.timestamp === event.timestamp && e.type === event.type)) {
          return s;
        }
        const next = [...s.events, event];
        return { events: next.length > 200 ? next.slice(-200) : next };
      });
    });
    socket.on(SocketEvents.PLAYER_VIEW_STATE, (pvs) => {
      set({ playerViewState: pvs });
    });
    socket.on(SocketEvents.TOKEN_USAGE, (usage) => {
      set({ tokenUsage: usage });
    });
    socket.on(SocketEvents.ERROR, (err) => {
      console.error('Server error:', err.message);
    });
    set({ socket });
  },
  createGame(config) {
    get().socket?.emit(SocketEvents.CREATE_GAME, config);
  },
  startGame() {
    get().socket?.emit(SocketEvents.START_GAME);
    set({ view: 'game', events: [] });
  },
  pauseGame() {
    get().socket?.emit(SocketEvents.PAUSE_GAME);
  },
  resumeGame() {
    get().socket?.emit(SocketEvents.RESUME_GAME);
  },
  stepGame() {
    get().socket?.emit(SocketEvents.STEP_GAME);
  },
  setSpectatorMode(mode) {
    get().socket?.emit(SocketEvents.SET_SPECTATOR_MODE, mode);
    set({ spectatorMode: mode, playerViewId: null, playerViewState: null });
  },
  setPlayerView(playerId) {
    const socket = get().socket;
    if (!playerId) {
      socket?.emit(SocketEvents.SET_PLAYER_VIEW, null);
      set({ spectatorMode: 'god', playerViewId: null, playerViewState: null });
      // Re-sync to god mode
      socket?.emit(SocketEvents.SET_SPECTATOR_MODE, 'god');
    } else {
      socket?.emit(SocketEvents.SET_PLAYER_VIEW, playerId);
      set({ spectatorMode: 'player', playerViewId: playerId, playerViewState: null });
    }
  },
  setView(view) {
    set({ view });
  },
}));
