import { ENV_SCHEMA } from '../../env.defaults.js'

/**
 * Satu-satunya tempat yang boleh menyentuh `import.meta.env`.
 * Komponen, service, dan hook harus `import { env } from '@/config/env'`
 * agar nama variabel & konversi tipe tidak tersebar di banyak file.
 */

/** `VITE_API_BASE_URL` → `apiBaseUrl` */
const toCamelCase = (key) =>
  key
    .replace(/^VITE_/, '')
    .toLowerCase()
    .replace(/_(\w)/g, (_, char) => char.toUpperCase())

const coerce = (type, value) => {
  if (type === 'boolean') return String(value).trim().toLowerCase() === 'true'
  if (type === 'number') {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) {
      throw new Error(`[env] nilai "${value}" bukan angka yang valid`)
    }
    return parsed
  }
  return String(value)
}

const resolve = () => {
  const entries = ENV_SCHEMA.map(({ key, type, default: fallback }) => {
    const raw = import.meta.env[key]
    const value = raw === undefined || raw === '' ? fallback : raw
    try {
      return [toCamelCase(key), coerce(type, value)]
    } catch (error) {
      throw new Error(`[env] ${key}: ${error.message}`)
    }
  })

  return Object.freeze({
    ...Object.fromEntries(entries),
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  })
}

export const env = resolve()
