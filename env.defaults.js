/**
 * Sumber tunggal (single source of truth) untuk seluruh variabel environment.
 *
 * Dipakai ulang oleh:
 *   - `vite.config.js`               → substitusi `%VITE_*%` di index.html
 *   - `src/config/env.js`            → nilai runtime yang dipakai komponen
 *   - `scripts/env-example.mjs`      → generate & cek sinkronisasi `.env.example`
 *
 * Menambah variabel baru? Cukup tambah satu entri di sini, lalu jalankan
 * `npm run env:example`. Jangan menulis daftar variabel di tempat lain.
 *
 * PENTING: seluruh nilai di sini terbundel ke JavaScript sisi klien dan dapat
 * dibaca siapa pun. Jangan pernah menaruh secret (API key, password, token).
 */

/** @typedef {'string' | 'number' | 'boolean'} EnvType */

/**
 * @type {ReadonlyArray<{
 *   key: string, group: string, description: string,
 *   default: string | number | boolean, type: EnvType
 * }>}
 */
export const ENV_SCHEMA = [
  {
    key: 'VITE_APP_NAME',
    group: 'Aplikasi',
    description: 'Nama aplikasi. Dipakai di <title> dan header layout.',
    default: 'AIO DevOps',
    type: 'string',
  },
  {
    key: 'VITE_APP_ENV',
    group: 'Aplikasi',
    description: 'Label lingkungan: development | staging | production.',
    default: 'development',
    type: 'string',
  },
  {
    key: 'VITE_API_BASE_URL',
    group: 'API (Issue #8)',
    description: 'Base URL backend. Semua request lewat HTTP client terpusat.',
    default: '/api',
    type: 'string',
  },
  {
    key: 'VITE_API_TIMEOUT',
    group: 'API (Issue #8)',
    description: 'Timeout request dalam milidetik.',
    default: 15000,
    type: 'number',
  },
  {
    key: 'VITE_USE_MOCK',
    group: 'API (Issue #8)',
    description: 'true = pakai mock data, false = hit API asli. Tanpa ubah komponen.',
    default: true,
    type: 'boolean',
  },
]

/** Peta `{ KEY: default }` — dipakai untuk fallback di luar konteks aplikasi. */
export const ENV_DEFAULTS = Object.fromEntries(ENV_SCHEMA.map((v) => [v.key, v.default]))
