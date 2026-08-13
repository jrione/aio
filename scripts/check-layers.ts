#!/usr/bin/env node
/**
 * Menjaga ruang lingkup Issue #8: "Komponen tidak boleh memanggil HTTP client
 * langsung."
 *
 * Aturan seperti ini hampir selalu benar di hari pertama dan bocor di bulan
 * ketiga — satu `http.get()` di dalam komponen karena sedang buru-buru, lalu
 * URL endpoint tersebar ke seluruh halaman dan mengganti backend jadi pekerjaan
 * mencari-dan-mengganti. Karena itu aturannya dijadikan gate, bukan sekadar
 * paragraf di README.
 *
 * Pemeriksaannya berbasis teks pada baris `import`. Tidak sekuat analisis AST,
 * tapi cukup: satu-satunya jalan menuju modul-modul ini memang lewat import,
 * dan hasilnya bisa dibaca siapa pun tanpa perangkat tambahan.
 */
import { readdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve, sep } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Batas lapisan punya dua bentuk, dan memaksakan keduanya jadi satu bentuk
 * membuat salah satunya canggung:
 *
 *   - **`allowedFrom`** — "hanya ini yang boleh masuk". Cocok untuk modul
 *     sempit dengan sedikit pemakai sah (token, sinyal 401, mock).
 *   - **`deniedFrom`** — "ini yang tidak boleh keluar". Cocok untuk arah impor
 *     antar lapisan, tempat pemakai sahnya justru hampir semua orang dan
 *     mendaftarnya satu per satu berarti daftar itu harus diperbarui setiap kali
 *     ada folder baru.
 */
interface LayerRule {
  /** Modul yang aksesnya dibatasi, dalam bentuk alias `@/…`. */
  readonly restricted: string
  /** Direktori (relatif terhadap root) yang boleh mengimpornya. */
  readonly allowedFrom?: readonly string[]
  /** Direktori yang dilarang mengimpornya. Selain itu boleh. */
  readonly deniedFrom?: readonly string[]
  readonly reason: string
}

const RULES: readonly LayerRule[] = [
  {
    restricted: '@/services/http.ts',
    allowedFrom: ['src/services'],
    reason:
      'Komponen memanggil hook domain di src/services/<domain>/*.queries.ts,\n' +
      '    bukan HTTP client. Path endpoint hanya boleh disebut di file service.',
  },
  {
    restricted: '@/services/mock/',
    allowedFrom: ['src/services/http.ts', 'src/services/mock'],
    reason:
      'Mock hanya boleh dijangkau lewat import() dinamis di src/services/http.ts.\n' +
      '    Mengimpornya statis membuat data tiruan ikut ke bundle produksi.',
  },
  {
    restricted: '@/services/auth-token.ts',
    allowedFrom: ['src/services/http.ts', 'src/features/auth'],
    reason:
      'Token hanya ditulis lapisan auth dan dibaca lapisan HTTP. Pembaca lain\n' +
      '    berarti token bocor ke tempat yang tidak mengelolanya.',
  },
  {
    restricted: '@/features/',
    deniedFrom: ['src/services'],
    reason:
      'Lapisan service tidak boleh tahu-menahu soal fitur. Arah impornya satu\n' +
      '    arah: fitur memanggil service, tidak pernah sebaliknya. Sekali dibalik,\n' +
      '    "siapa memakai siapa" berhenti bisa dijawab dengan membaca satu file —\n' +
      '    dan mock yang cuma butuh satu tipe ikut menyeret separuh aplikasi.',
  },
  {
    restricted: '@/services/unauthorized.ts',
    allowedFrom: ['src/services/http.ts', 'src/features/auth'],
    reason:
      'Hanya http.ts yang boleh memberi sinyal 401, dan hanya lapisan auth yang\n' +
      '    boleh menanggapinya. Pendengar kedua berarti "sesi berakhir" diputuskan\n' +
      '    di dua tempat, dengan urutan yang tidak ditulis siapa pun.',
  },
]

const SOURCE_EXTENSIONS = ['.ts', '.tsx']

/**
 * Impor statis, beserta kata kunci `type` bila ada.
 *
 * Grup 1 berisi `'type'` untuk `import type { X } from '…'`. Bentuk itu dihapus
 * total saat kompilasi (`verbatimModuleSyntax` di tsconfig), jadi tidak ada
 * modul yang benar-benar dimuat dan batas lapisan tidak dilanggar — mock boleh
 * meminjam tipe `MockRoute` tanpa membuat dirinya terjangkau dari bundle utama.
 *
 * Perhatikan bahwa `import { type X } from '…'` **tidak** ikut dikecualikan,
 * dan itu memang benar: bentuk itu tetap memancarkan `import {} from '…'`
 * sehingga modulnya sungguh dimuat.
 */
const STATIC_IMPORT = /^\s*import\s+(?:(type)\s+)?(?:[\s\S]*?\s+from\s*)?['"]([^'"]+)['"]/gm

/** `import('…')` — inilah yang dipakai `http.ts` untuk memuat mock. */
const DYNAMIC_IMPORT = /\bimport\s*\(\s*['"]([^'"]+)['"]/g

/** Modul yang benar-benar dimuat saat runtime oleh sebuah file. */
const runtimeImports = (contents: string): string[] => [
  ...[...contents.matchAll(STATIC_IMPORT)]
    .filter((match) => match[1] === undefined)
    .map((match) => match[2]),
  ...[...contents.matchAll(DYNAMIC_IMPORT)].map((match) => match[1]),
]

const sourceFiles = readdirSync(join(root, 'src'), { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => relative(root, join(entry.parentPath, entry.name)))
  .filter((file) => SOURCE_EXTENSIONS.some((extension) => file.endsWith(extension)))

/** Path dibandingkan dengan pemisah `/` agar hasilnya sama di Windows dan Linux. */
const normalize = (file: string): string => file.split(sep).join('/')

const isWithin = (file: string, directory: string): boolean =>
  file === directory || file.startsWith(`${directory}/`)

const isAllowed = (file: string, rule: LayerRule): boolean => {
  if (rule.deniedFrom) return !rule.deniedFrom.some((denied) => isWithin(file, denied))
  return (rule.allowedFrom ?? []).some((allowed) => isWithin(file, allowed))
}

interface Violation {
  file: string
  rule: LayerRule
}

const violations: Violation[] = []

for (const rawFile of sourceFiles) {
  const file = normalize(rawFile)
  const imported = runtimeImports(readFileSync(join(root, rawFile), 'utf8'))

  for (const rule of RULES) {
    if (isAllowed(file, rule)) continue
    if (imported.some((specifier) => specifier.startsWith(rule.restricted))) {
      violations.push({ file, rule })
    }
  }
}

if (violations.length > 0) {
  console.error('✖ Batas lapisan dilanggar:\n')
  for (const { file, rule } of violations) {
    console.error(`  ${file}`)
    console.error(`    mengimpor ${rule.restricted}`)
    console.error(`    ${rule.reason}\n`)
  }
  console.error('  Aturannya ada di scripts/check-layers.ts')
  process.exit(1)
}

console.log(
  `✓ Batas lapisan utuh: ${String(sourceFiles.length)} file diperiksa terhadap ${String(RULES.length)} aturan`,
)
