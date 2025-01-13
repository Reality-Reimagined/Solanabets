import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from "path";
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      include: ['buffer', 'crypto', 'stream', 'util']
    })
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      '@solana/web3.js',
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-wallets'
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});