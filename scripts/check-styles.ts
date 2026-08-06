#!/usr/bin/env node
/**
 * Menjaga acceptance criteria Issue #3: "Tidak ada file CSS per-komponen."
 *
 * Seluruh styling ditulis sebagai utility class Tailwind di file `.tsx`, dan
 * satu-satunya file CSS yang boleh ada adalah `src/index.css` — tempat direktif
 * Tailwind dan seluruh design token tinggal. Begitu styling boleh tersebar ke
 * `Button.css`, `Card.module.css`, dan seterusnya, design token kehilangan
 * statusnya sebagai sumber tunggal.
 *
 * Butuh pengecualian? Daftarkan di ALLOWLIST beserta alasannya.
 */
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Direktori yang di-scan rekursif. */
const SCANNED_DIRS = ['src', 'scripts', 'public']

/** Ekstensi stylesheet dalam bentuk apa pun. */
const STYLE_EXTENSIONS = ['.css', '.scss', '.sass', '.less', '.styl']

/** Satu-satunya file CSS global. Isinya direktif Tailwind + design token. */
const GLOBAL_STYLESHEET = join('src', 'index.css')

/** Path relatif yang boleh tetap jadi file style tersendiri, beserta alasannya. */
const ALLOWLIST = new Map<string, string>([
  [GLOBAL_STYLESHEET, 'File CSS global tunggal: direktif Tailwind + design token.'],
])

const collect = (dir: string): string[] => {
  const absolute = join(root, dir)
  if (!existsSync(absolute)) return []
  return readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(root, join(entry.parentPath, entry.name)))
}

const stylesheets = SCANNED_DIRS.flatMap(collect).filter((file) =>
  STYLE_EXTENSIONS.some((extension) => file.endsWith(extension)),
)

const offenders = stylesheets.filter((file) => !ALLOWLIST.has(file))

if (offenders.length > 0) {
  console.error('✖ Styling ditulis lewat utility class, tapi ditemukan stylesheet terpisah:')
  for (const file of offenders.sort()) console.error(`    ${file}`)
  console.error(
    `\n  Pindahkan ke utility class di komponen, taruh token-nya di ${GLOBAL_STYLESHEET},` +
      '\n  atau daftarkan di ALLOWLIST pada scripts/check-styles.ts',
  )
  process.exit(1)
}

if (!existsSync(join(root, GLOBAL_STYLESHEET))) {
  console.error(`✖ ${GLOBAL_STYLESHEET} tidak ditemukan — tidak ada direktif Tailwind & token.`)
  process.exit(1)
}

console.log(`✓ Styling terpusat: hanya ${GLOBAL_STYLESHEET}, tidak ada CSS per-komponen`)
