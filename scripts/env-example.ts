#!/usr/bin/env node
/**
 * Generate `.env.example` dari `env.defaults.ts`, atau cek sinkronisasinya.
 *
 *   node scripts/env-example.ts           → tulis ulang .env.example
 *   node scripts/env-example.ts --check   → exit 1 kalau tidak sinkron
 *
 * Dijalankan langsung oleh Node (type stripping bawaan Node >= 22.18),
 * tanpa langkah kompilasi terpisah.
 *
 * Memenuhi acceptance criteria Issue #9: ".env.example sinkron dengan
 * variabel yang benar-benar dipakai."
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'

import { ENV_SCHEMA, type EnvVariable } from '../env.defaults.ts'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const target = resolve(root, '.env.example')

const render = (): string => {
  const groups = new Map<string, EnvVariable[]>()
  for (const variable of ENV_SCHEMA) {
    const bucket = groups.get(variable.group) ?? []
    bucket.push(variable)
    groups.set(variable.group, bucket)
  }

  const lines = [
    '# ============================================================',
    '#  Dibuat otomatis dari env.defaults.ts — JANGAN diedit manual.',
    '#  Ubah env.defaults.ts lalu jalankan: npm run env:example',
    '# ============================================================',
    '#',
    '#  Setup lokal:  cp .env.example .env',
    '#  Semua nilai di bawah terbundel ke sisi klien dan bisa dibaca',
    '#  siapa pun — jangan pernah menaruh secret di sini.',
    '',
  ]

  for (const [group, variables] of groups) {
    lines.push(`# ── ${group} ${'─'.repeat(Math.max(0, 56 - group.length))}`)
    for (const variable of variables) {
      lines.push(`# ${variable.description}`)
      lines.push(`${variable.key}=${variable.default}`)
      lines.push('')
    }
  }

  return `${lines.join('\n').trimEnd()}\n`
}

/**
 * `VITE_API_BASE_URL` → `apiBaseUrl`, sama seperti di `src/config/env.ts`.
 *
 * Variabel dirujuk dengan dua ejaan berbeda tergantung tempatnya: nama aslinya
 * di `index.html` (`%VITE_APP_NAME%`) dan di `vite.config.ts`, tapi bentuk
 * camelCase-nya di dalam aplikasi (`env.apiBaseUrl`) karena `env.ts` yang
 * menerjemahkan. Keduanya harus ikut dicari.
 */
const toCamelCase = (key: string): string =>
  key
    .replace(/^VITE_/, '')
    .toLowerCase()
    .replace(/_(\w)/g, (_, char: string) => char.toUpperCase())

const SCANNED_DIRS = ['src', 'scripts']
const SCANNED_FILES = ['index.html', 'vite.config.ts']
const SCANNED_EXTENSIONS = ['.ts', '.tsx', '.html']

/**
 * Seluruh kode yang mungkin merujuk sebuah variabel, digabung jadi satu teks.
 *
 * `env.defaults.ts` sengaja **tidak** ikut: di sanalah variabelnya
 * dideklarasikan, jadi memasukkannya membuat setiap variabel terlihat "dipakai"
 * oleh dirinya sendiri dan pemeriksaan ini tidak akan pernah menemukan apa pun.
 */
const collectSources = (): string => {
  const fromDirs = SCANNED_DIRS.flatMap((dir) =>
    readdirSync(join(root, dir), { recursive: true, withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() && SCANNED_EXTENSIONS.some((extension) => entry.name.endsWith(extension)),
      )
      .map((entry) => readFileSync(join(entry.parentPath, entry.name), 'utf8')),
  )
  const fromFiles = SCANNED_FILES.map((file) => readFileSync(join(root, file), 'utf8'))
  return [...fromDirs, ...fromFiles].join('\n')
}

/**
 * Acceptance criteria Issue #9: ".env.example sinkron dengan variabel yang
 * **benar-benar dipakai**."
 *
 * Membandingkan `.env.example` dengan `env.defaults.ts` saja tidak cukup untuk
 * itu — keduanya bisa sama-sama sinkron dan sama-sama mendaftarkan variabel
 * yang sudah tidak dipakai siapa pun sejak tiga bulan lalu. Variabel mati
 * seperti itu mahal justru karena tidak menimbulkan error: ia tetap disalin ke
 * `.env` tiap orang baru, tetap muncul di dokumentasi deployment, dan tetap
 * ditanyakan "ini diisi apa ya?" oleh orang yang tidak tahu jawabannya adalah
 * "tidak usah".
 */
const findUnused = (): EnvVariable[] => {
  const sources = collectSources()
  return (ENV_SCHEMA as readonly EnvVariable[]).filter((variable) => {
    const camelCase = toCamelCase(variable.key)
    // Batas kata di kanan mencegah `apiBase` ikut cocok dengan `apiBaseUrl`.
    const referenced = new RegExp(`\\b(${variable.key}|${camelCase})\\b`).test(sources)
    return !referenced
  })
}

const content = render()

if (process.argv.includes('--check')) {
  let current = ''
  try {
    current = readFileSync(target, 'utf8')
  } catch {
    console.error('✖ .env.example tidak ditemukan. Jalankan: npm run env:example')
    process.exit(1)
  }
  if (current !== content) {
    console.error('✖ .env.example tidak sinkron dengan env.defaults.ts.')
    console.error('  Jalankan: npm run env:example')
    process.exit(1)
  }

  const unused = findUnused()
  if (unused.length > 0) {
    console.error('✖ Variabel terdaftar tapi tidak dipakai di mana pun:\n')
    for (const variable of unused) {
      console.error(`    ${variable.key}  —  ${variable.description}`)
    }
    console.error(
      '\n  Pakai variabelnya, atau hapus entrinya dari ENV_SCHEMA di env.defaults.ts' +
        '\n  lalu jalankan: npm run env:example',
    )
    process.exit(1)
  }

  console.log(`✓ .env.example sinkron, dan ${String(ENV_SCHEMA.length)} variabel semuanya terpakai`)
} else {
  writeFileSync(target, content)
  console.log(`✓ .env.example ditulis (${ENV_SCHEMA.length} variabel)`)
}
