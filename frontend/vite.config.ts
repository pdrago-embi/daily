import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function manualChunks(id: string) {
  if (id.includes('node_modules')) {
    if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
      return 'vendor-react'
    }
    if (id.includes('@tanstack')) {
      return 'vendor-query'
    }
    if (id.includes('recharts')) {
      return 'vendor-charts'
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': process.env.VITE_API_URL || 'http://localhost:3001',
    },
  },
  build: {
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
