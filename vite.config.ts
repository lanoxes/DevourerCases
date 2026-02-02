import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Setting base to './' ensures all assets are loaded via relative paths.
  // This prevents the common "failed to load script" error on Vercel.
  base: './',
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  define: {
    'process.env': process.env
  }
});