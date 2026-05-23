import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '172.16.65.10',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://172.16.65.10:3000',
        changeOrigin: true,
      }
    }
  }
})
