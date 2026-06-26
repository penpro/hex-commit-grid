// Vite config for the demo app under demo/. The component itself ships
// as source under src/ — no library build needed (consumers' bundlers
// handle JSX). This config exists to run `npm run dev` and see the
// component working before publishing.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'demo',
  server: { port: 5173 }
});
