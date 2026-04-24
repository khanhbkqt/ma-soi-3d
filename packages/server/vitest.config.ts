import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['src/__tests__/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@ma-soi/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
