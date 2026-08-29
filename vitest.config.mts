import { unpluginFactory } from '@stylexjs/unplugin';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [unpluginFactory({ dev: false }, { framework: 'vite' })],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
