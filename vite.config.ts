/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

function examModeHtmlPlugin(): Plugin {
  return {
    name: 'merise-exam-mode-html',
    transformIndexHtml(html) {
      return html
        .replace('<title>Merise - EPSI Edition</title>', '<title>Merise - EPSI Edition (Mode Contrôle)</title>')
        .replace('./favicon.svg', './favicon-controle.svg')
        .replace('./favicon.ico', './favicon-controle.ico')
        .replace('./apple-touch-icon.png', './apple-touch-icon-controle.png')
        .replace('./manifest.webmanifest', './manifest-controle.webmanifest')
        .replace(/#161b18/g, '#1c1214')
        .replace(/#f4f6f4/g, '#faf5f5')
        .replace(
          "document.documentElement.dataset.theme = dark ? 'dark' : 'light'",
          "document.documentElement.dataset.exam = 'true'\n        document.documentElement.dataset.theme = dark ? 'dark' : 'light'",
        )
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isExam = mode === 'controle'
  return {
    // Chemins d'assets relatifs : le même build marche à la racine d'un
    // domaine et dans le sous-dossier /controle/.
    base: './',
    define: {
      'import.meta.env.VITE_EXAM_MODE': JSON.stringify(isExam ? 'true' : 'false'),
    },
    plugins: [react(), tailwindcss(), ...(isExam ? [examModeHtmlPlugin()] : [])],
    build: {
      outDir: isExam ? 'dist/controle' : 'dist',
      emptyOutDir: true,
    },
    test: {
      // Vitest vide les CSS par défaut. Les tokens de index.css restent
      // lisibles pour le test de contraste (src/design/contrast.test.ts).
      css: { include: [/src[\\/]index\.css/] },
    },
  }
})
