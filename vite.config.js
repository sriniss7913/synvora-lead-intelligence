import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Ensures relative asset path resolution on custom subdomains
  server: {
    host: true,
    port: 5173
  }
})
