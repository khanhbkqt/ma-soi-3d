import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, '../server'), '');
  const bePort = env.PORT || '3001';

  return {
    plugins: [react()],
    resolve: {
      alias: { '@ma-soi/shared': path.resolve(__dirname, '../shared/src') }
    },
    define: {
      'import.meta.env.VITE_BE_PORT': JSON.stringify(bePort)
    },
    server: { 
      port: 5173, 
      proxy: { 
        '/api': `http://localhost:${bePort}`, 
        '/socket.io': { target: `http://localhost:${bePort}`, ws: true } 
      } 
    }
  };
});
