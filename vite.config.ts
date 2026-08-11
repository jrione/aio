import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { ENV_DEFAULTS } from './env.defaults.ts'
import { STORAGE_KEYS, THEME_ATTRIBUTE } from './src/store/storage-keys.ts'

/**
 * Menyisipkan skrip tema yang berjalan sebelum halaman pertama kali dilukis.
 *
 * Tanpa ini ada kedipan yang nyata: CSS di `<head>` sudah melukis latar terang
 * (atau gelap, mengikuti setelan sistem) jauh sebelum bundle JavaScript sempat
 * membaca pilihan pengguna dari localStorage. Pengguna yang memaksa tema gelap
 * akan melihat kilatan putih setiap kali membuka aplikasi — cacat kecil yang
 * langsung terlihat semua orang dan mustahil diperbaiki dari dalam React,
 * karena React baru berjalan setelah lukisan pertama.
 *
 * Skripnya dibangkitkan dari konstanta yang sama dengan yang dipakai runtime
 * (`src/store/storage-keys.ts`), jadi mengganti nama kunci storage tidak bisa
 * membuat keduanya berselisih diam-diam.
 */
const themeBootstrap = (): Plugin => ({
  name: 'theme-bootstrap',
  transformIndexHtml: () => [
    {
      tag: 'script',
      injectTo: 'head-prepend',
      children:
        `try{var t=localStorage.getItem(${JSON.stringify(STORAGE_KEYS.theme)});` +
        `if(t==="light"||t==="dark")` +
        `document.documentElement.setAttribute(${JSON.stringify(THEME_ATTRIBUTE)},t)}` +
        // Mode privat melarang localStorage. Tema ikut setelan sistem, dan itu
        // jauh lebih baik daripada halaman yang gagal dimuat.
        `catch(e){}`,
    },
  ],
})

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
    plugins: [react(), tailwindcss(), htmlEnvDefaults(env), themeBootstrap()],
    resolve: {
      // Vite membaca sendiri "paths" dari tsconfig.json, jadi alias `@/`
      // cukup didefinisikan sekali di sana — tidak diduplikasi di sini.
      // Menggantikan plugin vite-tsconfig-paths sejak Vite 8.
      tsconfigPaths: true,
    },
    server: {
      port: readPort(env, 'VITE_DEV_PORT'),
      // Gagal terang-terangan kalau port sudah dipakai, daripada diam-diam
      // pindah ke port lain sementara dokumentasi menyebut port yang lain.
      strictPort: true,
    },
  }
})
