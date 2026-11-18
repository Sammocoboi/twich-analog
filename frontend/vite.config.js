import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Порт фиксирован: он прописан в apiAllowOrigins / hlsAllowOrigins MediaMTX.
    strictPort: true,
    // host: true — чтобы открыть плеер с телефона в той же Wi-Fi сети.
    host: true,
  },
})
