import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/comfy-webui/',
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/prompt': 'http://127.0.0.1:8188',
      '/history': 'http://127.0.0.1:8188',
      '/view': 'http://127.0.0.1:8188',
    }
  }
})
