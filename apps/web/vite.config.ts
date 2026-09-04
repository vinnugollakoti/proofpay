import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Point envDir to root proofpay directory so web reads the single master .env
  envDir: path.resolve(__dirname, '../../'),
  server: {
    port: 5173,
    host: true,
  },
});
