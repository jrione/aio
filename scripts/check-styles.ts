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
import { readdirSync, existsSync, readFileSync } from 'node:fs'
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

/* ─────────────────────────────────────────────────────────────
 * Kedua blok tema gelap harus identik
 *
 * Tema punya tiga keadaan, dan dua di antaranya gelap: yang mengikuti
 * `prefers-color-scheme`, dan yang dipilih pengguna lewat `data-theme="dark"`.
 * CSS tidak punya cara menggabungkan sebuah media query dengan selector biasa,
 * jadi nilainya terpaksa ditulis dua kali.
 *
 * Duplikasi itu tidak berbahaya; yang berbahaya adalah **menyimpang**. Token
 * baru yang hanya ditambahkan di satu blok menghasilkan bug yang hampir mustahil
 * ditemukan lewat membaca kode: temanya benar bagi pengguna yang memilih gelap
 * secara eksplisit, dan salah bagi yang mengandalkan setelan sistem — dua
 * kelompok yang tidak pernah melihat layar satu sama lain.
 * ───────────────────────────────────────────────────────────── */

const css = readFileSync(join(root, GLOBAL_STYLESHEET), 'utf8')

/** Isi sebuah blok deklarasi, dinormalkan jadi daftar `properti: nilai`. */
const declarations = (block: string): string[] =>
  block
    .split(';')
    .map((line) => line.replace(/\/\*[\s\S]*?\*\//g, '').trim())
    .filter((line) => line.startsWith('--'))
    .sort()

/** Blok pertama setelah sebuah selector, dibaca sampai `}` pasangannya. */
const blockAfter = (source: string, marker: string): string | undefined => {
  const start = source.indexOf(marker)
  if (start === -1) return undefined
  const open = source.indexOf('{', start + marker.length)
  if (open === -1) return undefined

  let depth = 0
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1
    if (source[index] === '}') {
      depth -= 1
      if (depth === 0) return source.slice(open + 1, index)
    }
  }
  return undefined
}

const fromMedia = blockAfter(css, ":root:not([data-theme='light'])")
const fromAttribute = blockAfter(css, ":root[data-theme='dark']")

if (!fromMedia || !fromAttribute) {
  console.error('✖ Salah satu blok tema gelap tidak ditemukan di', GLOBAL_STYLESHEET)
  console.error("  Dicari: `:root:not([data-theme='light'])` dan `:root[data-theme='dark']`")
  process.exit(1)
}

const media = declarations(fromMedia)
const attribute = declarations(fromAttribute)

const onlyInMedia = media.filter((line) => !attribute.includes(line))
const onlyInAttribute = attribute.filter((line) => !media.includes(line))

if (onlyInMedia.length > 0 || onlyInAttribute.length > 0) {
  console.error('✖ Dua blok tema gelap menyimpang:\n')
  for (const line of onlyInMedia) console.error(`    hanya di media query   : ${line}`)
  for (const line of onlyInAttribute) console.error(`    hanya di [data-theme]  : ${line}`)
  console.error(
    '\n  Keduanya harus berisi token yang sama persis, kalau tidak tema gelap\n' +
      '  berbeda antara "ikut sistem" dan "dipilih pengguna".',
  )
  process.exit(1)
}

console.log(
  `✓ Styling terpusat: hanya ${GLOBAL_STYLESHEET}, tidak ada CSS per-komponen\n` +
    `✓ Tema gelap konsisten: ${String(media.length)} token sama di kedua blok`,
)
