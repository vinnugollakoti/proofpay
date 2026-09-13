import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  // Point envDir to root proofpay directory if present, otherwise local (for Vercel root dir deploys)
  envDir: fs.existsSync(path.resolve(__dirname, '../../.env'))
    ? path.resolve(__dirname, '../../')
    : __dirname,
  server: {
    port: 5173,
    host: true,
  },
});
