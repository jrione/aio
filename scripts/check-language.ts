#!/usr/bin/env node
/**
 * Menjaga acceptance criteria Issue #2: "Tidak ada campuran .jsx dan .tsx
 * di dalam project."
 *
 * Gagal (exit 1) bila ada file JavaScript yang menyelinap masuk ke source
 * tree setelah project diputuskan memakai TypeScript. Menambah pengecualian?
 * Daftarkan di ALLOWLIST beserta alasannya.
 */
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')

/** Direktori yang di-scan rekursif. */
const SCANNED_DIRS = ['src', 'scripts']

/** Ekstensi yang dilarang — project ini TypeScript-only. */
const FORBIDDEN = ['.js', '.jsx', '.mjs', '.cjs']

/** Path relatif yang boleh tetap JavaScript, beserta alasannya. */
const ALLOWLIST = new Map<string, string>()

const collect = (dir: string): string[] => {
  const absolute = join(root, dir)
  if (!existsSync(absolute)) return []
  return readdirSync(absolute, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => relative(root, join(entry.parentPath, entry.name)))
}

const rootFiles = readdirSync(root, { withFileTypes: true })
  .filter((entry) => entry.isFile())
  .map((entry) => entry.name)

const candidates = [...SCANNED_DIRS.flatMap(collect), ...rootFiles]

const offenders = candidates.filter(
  (file) => FORBIDDEN.some((extension) => file.endsWith(extension)) && !ALLOWLIST.has(file),
)

if (offenders.length > 0) {
  console.error('✖ Project ini TypeScript-only, tapi ditemukan file JavaScript:')
  for (const file of offenders.sort()) console.error(`    ${file}`)
  console.error(
    '\n  Konversi ke .ts/.tsx, atau daftarkan di ALLOWLIST pada scripts/check-language.ts',
  )
  process.exit(1)
}

console.log(`✓ TypeScript-only: ${candidates.length} file diperiksa, tidak ada .js/.jsx`)
