#!/usr/bin/env node
/**
 * Menjaga acceptance criteria Issue #16:
 *   - "Initial bundle wajar (indikatif: < 300 KB gzip)"
 *   - "Tidak ada warning chunk besar saat build"
 *
 * Keduanya benar hari ini. Yang membuat gate ini ada bukan keadaan hari ini,
 * melainkan bulan ketiga: satu `import` yang salah tempat — sebuah komponen
 * yang menarik library grafik ke bundle utama — cukup untuk melipatgandakan
 * halaman pertama, dan tidak ada yang menyadarinya sampai seseorang kebetulan
 * membuka tab Network. Ukuran bundle adalah hal yang memburuk perlahan dan
 * tanpa gejala; itu jenis masalah yang memang layak dijadikan gate.
 *
 * ## Apa yang disebut "initial bundle"
 *
 * Bukan sekadar berkas terbesar. Yang benar-benar diunduh sebelum halaman
 * pertama bisa tampil adalah apa yang dirujuk `index.html`: skrip entry,
 * seluruh `modulepreload`, dan stylesheet-nya. Ketiganya dibaca dari HTML hasil
 * build, bukan ditebak dari nama berkas — dengan begitu perubahan cara Vite
 * memecah chunk tidak diam-diam membuat pengukuran ini salah.
 *
 * Chunk halaman (`DashboardPage-*.js`) tidak dihitung: ia baru diunduh saat
 * route-nya dibuka. Itu memang inti dari code splitting.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')

/** Batas dari acceptance criteria Issue #16. */
const INITIAL_BUDGET_KB = 300

/**
 * Ambang yang sama dengan `build.chunkSizeWarningLimit` bawaan Vite.
 *
 * Diperiksa ulang di sini, bukan sekadar mengandalkan peringatan Vite, karena
 * peringatan hanya membuat build berwarna kuning — dan build yang lolos dengan
 * peringatan tetap lolos. Gate ini yang membuatnya berhenti.
 */
const CHUNK_LIMIT_KB = 500

/** Diperingatkan (bukan digagalkan) saat pemakaian sudah melewati porsi ini. */
const WARN_RATIO = 0.75

if (!existsSync(dist)) {
  console.error('✖ dist/ tidak ada. Jalankan `npm run build` lebih dulu.')
  process.exit(1)
}

const html = readFileSync(join(dist, 'index.html'), 'utf8')

/** Semua berkas yang dirujuk `index.html` — inilah yang diunduh lebih dulu. */
const REFERENCED = /(?:src|href)="\/(assets\/[^"]+)"/g

const initialFiles = [...new Set([...html.matchAll(REFERENCED)].map((match) => match[1]))]

if (initialFiles.length === 0) {
  console.error('✖ Tidak ada aset yang dirujuk index.html — hasil build tidak seperti yang diduga.')
  process.exit(1)
}

const kb = (bytes: number): number => Math.round((bytes / 1024) * 100) / 100

const measure = (file: string): { file: string; raw: number; gzip: number } => {
  const contents = readFileSync(join(dist, file))
  return { file, raw: contents.byteLength, gzip: gzipSync(contents).byteLength }
}

const initial = initialFiles.map(measure).sort((left, right) => right.gzip - left.gzip)
const initialGzip = initial.reduce((total, entry) => total + entry.gzip, 0)

/* ─────────────────────────────────────────────────────────────
 * Laporan
 * ───────────────────────────────────────────────────────────── */

const pad = (text: string, width: number): string => text.padEnd(width)

console.log('Initial bundle — yang diunduh sebelum halaman pertama tampil:\n')
for (const entry of initial) {
  console.log(
    `    ${pad(entry.file, 42)} ${pad(`${String(kb(entry.raw))} kB`, 12)} gzip ${String(kb(entry.gzip))} kB`,
  )
}
console.log(
  `\n    ${pad('TOTAL', 42)} ${pad('', 12)} gzip ${String(kb(initialGzip))} kB ` +
    `dari ${String(INITIAL_BUDGET_KB)} kB`,
)

const allChunks = readdirSync(join(dist, 'assets'))
  .filter((file) => file.endsWith('.js'))
  .map((file) => measure(join('assets', file)))
  .sort((left, right) => right.raw - left.raw)

const lazyChunks = allChunks.filter(
  (entry) => !initialFiles.includes(entry.file.split('\\').join('/')),
)

console.log('\nChunk yang dimuat sesuai kebutuhan (tidak dihitung ke initial):\n')
for (const entry of lazyChunks.slice(0, 5)) {
  console.log(
    `    ${pad(entry.file, 42)} ${pad(`${String(kb(entry.raw))} kB`, 12)} gzip ${String(kb(entry.gzip))} kB`,
  )
}

/* ─────────────────────────────────────────────────────────────
 * Putusan
 * ───────────────────────────────────────────────────────────── */

const problems: string[] = []

if (kb(initialGzip) > INITIAL_BUDGET_KB) {
  problems.push(
    `Initial bundle ${String(kb(initialGzip))} kB gzip, melewati batas ${String(INITIAL_BUDGET_KB)} kB.\n` +
      '    Biasanya sebabnya satu impor statis yang seharusnya lazy — periksa\n' +
      '    daftar di atas untuk berkas yang tiba-tiba membesar.',
  )
}

for (const entry of allChunks) {
  if (kb(entry.raw) > CHUNK_LIMIT_KB) {
    problems.push(
      `Chunk ${entry.file} berukuran ${String(kb(entry.raw))} kB, melewati ${String(CHUNK_LIMIT_KB)} kB.\n` +
        '    Pecah lewat lazy import, atau naikkan batasnya di sini beserta alasannya.',
    )
  }
}

if (problems.length > 0) {
  console.error('\n✖ Anggaran bundle terlampaui:\n')
  for (const problem of problems) console.error(`  ${problem}\n`)
  process.exit(1)
}

const ratio = kb(initialGzip) / INITIAL_BUDGET_KB
if (ratio > WARN_RATIO) {
  console.log(
    `\n⚠ Initial bundle sudah memakai ${String(Math.round(ratio * 100))}% anggaran. ` +
      'Masih lolos, tapi layak diperhatikan.',
  )
}

console.log(
  `\n✓ Initial ${String(kb(initialGzip))} kB gzip (batas ${String(INITIAL_BUDGET_KB)} kB) · ` +
    `chunk terbesar ${String(kb(allChunks[0].raw))} kB (batas ${String(CHUNK_LIMIT_KB)} kB)`,
)
