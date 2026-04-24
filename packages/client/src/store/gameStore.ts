import { io, Socket } from 'socket.io-client';
import { SocketEvents, GameState, GameEvent, GameConfig, Phase } from '@ma-soi/shared';
import { create } from 'zustand';

interface GameStore {
  socket: Socket | null;
  connected: boolean;
  gameState: GameState | null;
  events: GameEvent[];
  spectatorMode: 'god' | 'fog';
  view: 'lobby' | 'game';

  connect(): void;
  createGame(config: GameConfig): void;
  startGame(): void;
  pauseGame(): void;
  resumeGame(): void;
  stepGame(): void;
  setSpectatorMode(mode: 'god' | 'fog'): void;
  setView(view: 'lobby' | 'game'): void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  connected: false,
  gameState: null,
  events: [],
  spectatorMode: 'god',
  view: 'lobby',

  connect() {
    // Guard against double invocation (React StrictMode in dev)
    const existing = get().socket;
    if (existing) {
      existing.disconnect();
    }

    const socket = io(window.location.hostname === 'localhost' ? 'http://localhost:3001' : '/', { transports: ['websocket', 'polling'] });

    socket.on('connect', () => set({ connected: true }));
    socket.on('disconnect', () => set({ connected: false }));

    socket.on(SocketEvents.GAME_STATE, (state: GameState) => {
      set({ gameState: state, events: state.events });
      if (state.phase !== Phase.Lobby && state.phase !== Phase.GameOver) {
        set({ view: 'game' });
      }
    });

    socket.on(SocketEvents.GAME_EVENT, (event: GameEvent) => {
      set(s => {
        // Deduplicate: skip if this event timestamp already exists
        if (s.events.some(e => e.timestamp === event.timestamp && e.type === event.type)) {
          return s;
        }
        return { events: [...s.events, event] };
      });
    });

    socket.on(SocketEvents.ERROR, (err: { message: string }) => {
      console.error('Server error:', err.message);
    });

    set({ socket });
  },

  createGame(config) { get().socket?.emit(SocketEvents.CREATE_GAME, config); },
  startGame() { get().socket?.emit(SocketEvents.START_GAME); set({ view: 'game', events: [] }); },
  pauseGame() { get().socket?.emit(SocketEvents.PAUSE_GAME); },
  resumeGame() { get().socket?.emit(SocketEvents.RESUME_GAME); },
  stepGame() { get().socket?.emit(SocketEvents.STEP_GAME); },
  setSpectatorMode(mode) { get().socket?.emit(SocketEvents.SET_SPECTATOR_MODE, mode); set({ spectatorMode: mode }); },
  setView(view) { set({ view }); },
}));
