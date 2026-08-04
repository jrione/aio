import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

import { ENV_DEFAULTS } from './env.defaults.ts'

/**
 * Mengisi placeholder `%VITE_*%` di index.html dengan default dari
 * env.defaults.ts bila variabel tersebut tidak ada di file `.env`.
 * Tanpa ini, clone baru yang belum menyalin `.env` akan menampilkan
 * teks mentah `%VITE_APP_NAME%` di tab browser.
 */
const htmlEnvDefaults = (env: Record<string, string | number | boolean>): Plugin => ({
  name: 'html-env-defaults',
  transformIndexHtml: (html: string) =>
    html.replace(/%(VITE_\w+)%/g, (placeholder, key: string) =>
      key in env ? String(env[key]) : placeholder,
    ),
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const fileEnv = loadEnv(mode, process.cwd(), 'VITE_')

  return {
    plugins: [react(), htmlEnvDefaults({ ...ENV_DEFAULTS, ...fileEnv })],
  }
})
