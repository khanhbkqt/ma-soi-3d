import { io, Socket } from 'socket.io-client';
import {
  SocketEvents,
  GameState,
  GameEvent,
  GameEventType,
  GameConfig,
  Phase,
  Player,
  PlayerViewState,
  GameTokenUsage,
} from '@ma-soi/shared';
import { create } from 'zustand';

interface GameStore {
  socket: Socket | null;
  connected: boolean;
  gameState: GameState | null;
  events: GameEvent[];
  lastEvent: GameEvent | null;
  playersMap: Map<string, Player>;
  dayPhaseStartTime: number | null;
  spectatorMode: 'god' | 'fog' | 'player';
  playerViewState: PlayerViewState | null;
  playerViewId: string | null;
  tokenUsage: GameTokenUsage | null;
  view: 'lobby' | 'game';

  connect(): void;
  createGame(config: GameConfig): void;
  startGame(): void;
  pauseGame(): void;
  resumeGame(): void;
  stepGame(): void;
  setSpectatorMode(mode: 'god' | 'fog'): void;
  setPlayerView(playerId: string | null): void;
  setView(view: 'lobby' | 'game'): void;
}

function buildPlayersMap(players: Player[]): Map<string, Player> {
  const map = new Map<string, Player>();
  for (const p of players) map.set(p.id, p);
  return map;
}

export const useGameStore = create<GameStore>((set, get) => ({
  socket: null,
  connected: false,
  gameState: null,
  events: [],
  lastEvent: null,
  playersMap: new Map(),
  dayPhaseStartTime: null,
  spectatorMode: 'god',
  playerViewState: null,
  playerViewId: null,
  tokenUsage: null,
  view: 'lobby',

  connect() {
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

    socket.on(SocketEvents.GAME_STATE, (state: GameState) => {
      // Don't overwrite events from GAME_STATE — GAME_EVENT handles incremental updates.
      // Only seed events if our local array is empty (initial load / reconnect).
      const s = get();
      const updates: Partial<GameStore> = {
        gameState: state,
        playersMap: buildPlayersMap(state.players),
      };
      if (s.events.length === 0 && state.events.length > 0) {
        updates.events = state.events;
        updates.lastEvent = state.events[state.events.length - 1] ?? null;
      }
      if (state.phase !== Phase.Lobby && state.phase !== Phase.GameOver) {
        updates.view = 'game';
      }
      set(updates);
    });

    socket.on(SocketEvents.GAME_EVENT, (event: GameEvent) => {
      set((s) => {
        if (s.events.some((e) => e.timestamp === event.timestamp && e.type === event.type)) {
          return s;
        }
        const next = [...s.events, event];
        const updates: Partial<GameStore> = {
          events: next.length > 200 ? next.slice(-200) : next,
          lastEvent: event,
        };
        // Track day phase start time
        if (event.type === GameEventType.PhaseChanged && event.data.phase === Phase.Day) {
          updates.dayPhaseStartTime = event.timestamp;
        }
        return updates;
      });
    });

    socket.on(SocketEvents.PLAYER_VIEW_STATE, (pvs: PlayerViewState) => {
      set({ playerViewState: pvs });
    });

    socket.on(SocketEvents.TOKEN_USAGE, (usage: GameTokenUsage) => {
      set({ tokenUsage: usage });
    });

    socket.on(SocketEvents.ERROR, (err: { message: string }) => {
      console.error('Server error:', err.message);
    });

    set({ socket });
  },

  createGame(config) {
    get().socket?.emit(SocketEvents.CREATE_GAME, config);
  },
  startGame() {
    get().socket?.emit(SocketEvents.START_GAME);
    set({ view: 'game', events: [], lastEvent: null, dayPhaseStartTime: null });
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
