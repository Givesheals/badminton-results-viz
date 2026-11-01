/// <reference types="vitest/config" />
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

/** GitHub Pages has no SPA fallback, so /team-sheet needs its own index.html. */
function teamSheetHtmlPlugin(): Plugin {
  return {
    name: 'team-sheet-html',
    apply: 'build',
    closeBundle() {
      const distDir = path.resolve(process.cwd(), 'dist')
      const htmlPath = path.join(distDir, 'index.html')
      if (!fs.existsSync(htmlPath)) return
      const targetDir = path.join(distDir, 'team-sheet')
      fs.mkdirSync(targetDir, { recursive: true })
      fs.copyFileSync(htmlPath, path.join(targetDir, 'index.html'))
    },
  }
}

export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/badminton-results-viz/' : '/',
  plugins: [react(), tailwindcss(), teamSheetHtmlPlugin()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
