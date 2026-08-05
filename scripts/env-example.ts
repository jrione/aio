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
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

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
  console.log('✓ .env.example sinkron dengan env.defaults.ts')
} else {
  writeFileSync(target, content)
  console.log(`✓ .env.example ditulis (${ENV_SCHEMA.length} variabel)`)
}
