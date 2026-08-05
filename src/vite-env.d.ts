/// <reference types="vite/client" />

import type { EnvKey } from '../env.defaults.ts'

declare global {
  /**
   * Mengetikkan `import.meta.env` dari ENV_SCHEMA. Nilainya `string | undefined`
   * karena isi file `.env` selalu string dan variabelnya bisa saja tidak diset —
   * konversi ke tipe akhir dilakukan sekali saja di `src/config/env.ts`.
   */
  interface ImportMetaEnv extends Record<EnvKey, string | undefined> {}
}
