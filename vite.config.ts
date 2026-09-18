import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Project pages are served from /<repo>/, so keep asset URLs relative.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 4096 },
})
