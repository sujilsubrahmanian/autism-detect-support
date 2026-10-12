import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Dev: the browser talks to Vite (5173) and Vite forwards /api to Django (8000).
// Production: VITE_API_URL points at the deployed API.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: { '/api': process.env.VITE_PROXY_TARGET || 'http://localhost:8000' },
  },
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.js', css: false },
})
