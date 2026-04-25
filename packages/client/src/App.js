import { jsx as _jsx } from 'react/jsx-runtime';
import { useEffect } from 'react';
import { useGameStore } from './store/gameStore';
import Lobby from './components/lobby/Lobby';
import GameView from './components/game/GameView';
export default function App() {
  const { connect, view } = useGameStore();
  useEffect(() => {
    connect();
    return () => {
      const socket = useGameStore.getState().socket;
      socket?.disconnect();
    };
  }, []);
  return view === 'lobby' ? _jsx(Lobby, {}) : _jsx(GameView, {});
}
