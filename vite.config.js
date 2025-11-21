import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Dev server proxy: forward /user requests to backend to avoid CORS during development.
  server: {
    proxy: {
      '/user': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/contact': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})