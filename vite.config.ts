import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

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

/**
 * Membaca variabel bertipe angka dari env, dengan fallback ke default di
 * env.defaults.ts. Nilai yang tidak masuk akal ditolak keras di sini agar
 * salah ketik (`VITE_DEV_PORT=abc`) gagal saat start, bukan diam-diam
 * jatuh ke port lain.
 */
const readPort = (env: Record<string, string | number | boolean>, key: string): number => {
  const port = Number(env[key])
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`[env] ${key}="${env[key]}" bukan nomor port yang valid (1–65535)`)
  }
  return port
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = { ...ENV_DEFAULTS, ...loadEnv(mode, process.cwd(), 'VITE_') }

  return {
    // tsconfigPaths membaca "paths" dari tsconfig.json, jadi alias `@/`
    // cukup didefinisikan sekali di sana — tidak diduplikasi di sini.
    plugins: [tsconfigPaths(), react(), tailwindcss(), htmlEnvDefaults(env)],
    server: {
      port: readPort(env, 'VITE_DEV_PORT'),
      // Gagal terang-terangan kalau port sudah dipakai, daripada diam-diam
      // pindah ke port lain sementara dokumentasi menyebut port yang lain.
      strictPort: true,
    },
  }
})
