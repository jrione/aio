import { ENV_SCHEMA, type EnvType, type EnvVariable } from '../../env.defaults.ts'

/**
 * Satu-satunya tempat yang boleh menyentuh `import.meta.env`.
 * Komponen, service, dan hook harus `import { env } from '@/config/env'`
 * agar nama variabel & konversi tipe tidak tersebar di banyak file.
 *
 * Bentuk dan tipe `env` diturunkan otomatis dari ENV_SCHEMA, jadi menambah
 * variabel di `env.defaults.ts` langsung memunculkan properti barunya di sini
 * lengkap dengan tipe yang benar — tanpa perlu menulis ulang daftarnya.
 */

/** `'VITE_API_BASE_URL'` → `'API_BASE_URL'` */
type StripPrefix<Key extends string> = Key extends `VITE_${infer Rest}` ? Rest : never

/** `'API_BASE_URL'` → `'apiBaseUrl'` */
type SnakeToCamel<Key extends string> = Key extends `${infer Head}_${infer Tail}`
  ? `${Lowercase<Head>}${Capitalize<SnakeToCamel<Tail>>}`
  : Lowercase<Key>

type ValueOf<Type extends EnvType> = Type extends 'boolean'
  ? boolean
  : Type extends 'number'
    ? number
    : string

export type Env = {
  readonly [
    Variable in (typeof ENV_SCHEMA)[number] as SnakeToCamel<StripPrefix<Variable['key']>>
  ]: ValueOf<Variable['type']>
} & {
  readonly isDev: boolean
  readonly isProd: boolean
}

/** `VITE_API_BASE_URL` → `apiBaseUrl` */
const toCamelCase = (key: string): string =>
  key
    .replace(/^VITE_/, '')
    .toLowerCase()
    .replace(/_(\w)/g, (_, char: string) => char.toUpperCase())

const coerce = (type: EnvType, value: string | number | boolean): string | number | boolean => {
  if (type === 'boolean') return String(value).trim().toLowerCase() === 'true'
  if (type === 'number') {
    const parsed = Number(value)
    if (Number.isNaN(parsed)) {
      throw new Error(`nilai "${value}" bukan angka yang valid`)
    }
    return parsed
  }
  return String(value)
}

const resolve = (): Env => {
  const entries = (ENV_SCHEMA as readonly EnvVariable[]).map(({ key, type, default: fallback }) => {
    const raw = import.meta.env[key]
    const value = raw === undefined || raw === '' ? fallback : raw
    try {
      return [toCamelCase(key), coerce(type, value)] as const
    } catch (error) {
      // `cause` dipertahankan supaya jejak error aslinya tidak hilang saat
      // dibungkus ulang dengan nama variabelnya.
      const detail = error instanceof Error ? error.message : String(error)
      throw new Error(`[env] ${key}: ${detail}`, { cause: error })
    }
  })

  // Satu-satunya cast di file ini: objeknya dibangun dinamis dari ENV_SCHEMA,
  // sedangkan bentuk akhirnya sudah dijamin oleh tipe `Env` di atas.
  return Object.freeze({
    ...Object.fromEntries(entries),
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
  }) as Env
}

export const env = resolve()
