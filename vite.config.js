// Vite config for the demo app under demo/. The component itself ships
// as source under src/ — no library build needed (consumers' bundlers
// handle JSX). This config exists to run `npm run dev` and see the
// component working before publishing.

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'demo',
  // Honor a PORT env var (used by the preview harness / autoPort) and
  // fall back to 5173 for plain `npm run dev`.
  server: { port: Number(process.env.PORT) || 5173 }
});
