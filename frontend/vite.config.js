import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // No source maps in production, so the browser's developer tools show
    // only the minified bundle, not the original source files
    sourcemap: false,
  },
})
