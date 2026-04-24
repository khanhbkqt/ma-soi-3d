import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { GameConfig, SocketEvents, GameEvent, GameEventType, getRoleDistribution } from '@ma-soi/shared';
import { GameMaster } from './game/GameMaster.js';
import { AgentManager } from './game/AgentManager.js';
import { createProvider } from './providers/index.js';
import { PERSONALITIES } from './agents/personalities.js';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: '*' } });

let currentGM: GameMaster | null = null;
let currentManager: AgentManager | null = null;

// REST endpoints
app.get('/api/health', (_req, res) => { res.json({ status: 'ok' }); });
app.get('/api/personalities', (_req, res) => { res.json(PERSONALITIES); });

// Default provider from env vars
app.get('/api/default-provider', (_req, res) => {
  const baseUrl = process.env.LLM_BASE_URL;
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL || 'gpt-4o-mini';
  const name = process.env.LLM_PROVIDER_NAME || 'Default Provider';
  if (!baseUrl || !apiKey) {
    return res.json({ available: false });
  }
  res.json({
    available: true,
    provider: { type: 'openai-compatible', name, baseUrl, apiKey, model },
  });
});
app.get('/api/roles/:count', (req, res) => {
  try {
    const count = parseInt(req.params.count);
    res.json(getRoleDistribution(count));
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.post('/api/providers/test', async (req, res) => {
  try {
    const provider = createProvider(req.body);
    await provider.test();
    res.json({ success: true });
  } catch (e: any) { res.json({ success: false, error: e.message }); }
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.data.godView = true;

  socket.on(SocketEvents.SET_SPECTATOR_MODE, (mode: 'god' | 'fog') => {
    socket.data.godView = mode === 'god';
    socket.data.playerViewId = null;  // Clear player view when switching modes
    // Re-send current state filtered
    if (currentGM) {
      const state = { ...currentGM.state };
      if (!socket.data.godView) {
        state.events = state.events.filter(e => e.isPublic);
      }
      socket.emit(SocketEvents.GAME_STATE, state);
    }
  });

  socket.on(SocketEvents.SET_PLAYER_VIEW, (playerId: string | null) => {
    socket.data.playerViewId = playerId;
    if (playerId && currentManager) {
      const pvs = currentManager.getPlayerViewState(playerId);
      if (pvs) socket.emit(SocketEvents.PLAYER_VIEW_STATE, pvs);
    }
    // Also send full game state (events will be filtered client-side)
    if (currentGM) {
      socket.emit(SocketEvents.GAME_STATE, currentGM.state);
    }
  });

  socket.on(SocketEvents.CREATE_GAME, async (config: GameConfig) => {
    try {
      const gm = new GameMaster();
      const manager = new AgentManager(gm);
      const players = manager.setupGame(config);
      gm.createGame(config, players);
      gm.setResolver(manager);

      currentGM = gm;
      currentManager = manager;

      // Forward game events to all clients
      gm.on('gameEvent', (event: GameEvent) => {
        // Send to all sockets based on their view mode
        for (const [, s] of io.sockets.sockets) {
          if (s.data.playerViewId) {
            // Player view: send all events (client filters by visibility)
            s.emit(SocketEvents.GAME_EVENT, event);
            // Push updated player view state
            const pvs = manager.getPlayerViewState(s.data.playerViewId);
            if (pvs) s.emit(SocketEvents.PLAYER_VIEW_STATE, pvs);
          } else if (event.isPublic || s.data.godView) {
            s.emit(SocketEvents.GAME_EVENT, event);
          }
        }
        // Send full state only on major transitions (phase changes, game over)
        if (event.type === GameEventType.PhaseChanged || event.type === GameEventType.GameOver || event.type === GameEventType.GameStarted) {
          for (const [, s] of io.sockets.sockets) {
            const state = { ...gm.state };
            if (!s.data.godView && !s.data.playerViewId) {
              state.events = state.events.filter(e => e.isPublic);
            }
            s.emit(SocketEvents.GAME_STATE, state);
          }
        }
      });

      socket.emit(SocketEvents.GAME_STATE, gm.state);
    } catch (e: any) {
      socket.emit(SocketEvents.ERROR, { message: e.message });
    }
  });

  socket.on(SocketEvents.START_GAME, async () => {
    if (!currentGM) return socket.emit(SocketEvents.ERROR, { message: 'No game created' });
    try {
      currentGM.startGame().catch(e => {
        console.error('Game error:', e);
        io.emit(SocketEvents.ERROR, { message: e.message });
      });
    } catch (e: any) {
      socket.emit(SocketEvents.ERROR, { message: e.message });
    }
  });

  socket.on(SocketEvents.PAUSE_GAME, () => { currentGM?.pause(); });
  socket.on(SocketEvents.RESUME_GAME, () => { currentGM?.resume(); });
  socket.on(SocketEvents.STEP_GAME, () => { currentGM?.step(); });

  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`🐺 Ma Sói server running on port ${PORT}`));

export { app, io, httpServer };
