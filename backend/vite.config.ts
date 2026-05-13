import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import adonisjs from '@adonisjs/vite/client'

const here = dirname(fileURLToPath(import.meta.url))
const FRONTEND = resolve(here, '..', 'frontend')

export default defineConfig({
  root: FRONTEND,

  plugins: [
    tailwindcss(),
    react(),
    adonisjs({
      entrypoints: ['app.tsx', 'css/app.css'],
      reload: ['../backend/resources/views/**/*.edge'],
    }),
  ],

  resolve: {
    alias: {
      '@': FRONTEND,
    },
  },

  build: {
    outDir: resolve(here, 'public', 'assets'),
    emptyOutDir: true,
    manifest: true,
  },
})
