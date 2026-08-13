/**
 * Pemformat dan label yang dipakai lebih dari satu fitur.
 *
 * Tinggal di akar `src/features/`, bukan di dalam salah satu fitur, karena
 * sejak Issue #12 ada dua yang memakainya: dashboard dan deployments. Kalau
 * salah satu fitur yang memilikinya, fitur lain harus mengimpor dari tetangga —
 * dan begitu itu terjadi sekali, urutan siapa bergantung pada siapa berhenti
 * bisa dijelaskan.
 *
 * Yang khusus satu fitur tetap tinggal di fitur itu; lihat
 * `src/features/dashboard/formatters.ts`.
 *
 * Objek `Intl.*` dibuat sekali di tingkat modul. Membuatnya di dalam render
 * berarti membangun ulang tabel lokalisasi setiap kali komponen dirender —
 * ongkos yang tidak terlihat sampai jumlah barisnya bertambah.
 */
import type { Role } from '@/services/auth/auth.types.ts'
import { ENVIRONMENTS, type DeploymentEnvironment } from '@/services/environment.ts'

/**
 * Nama peran untuk ditampilkan.
 *
 * Peran dikirim server dalam bahasa Inggris karena ia bagian dari kontrak;
 * yang dilihat pengguna tidak harus mengikutinya. Keterangannya ikut di sini
 * supaya halaman yang menampilkan peran tidak perlu menjelaskannya sendiri
 * dengan kalimat yang berbeda-beda.
 */
export const ROLE_LABEL: Record<Role, { name: string; description: string }> = {
  admin: { name: 'Admin', description: 'Akses penuh, termasuk pengaturan sistem.' },
  operator: { name: 'Operator', description: 'Menjalankan dan membatalkan deployment.' },
  viewer: { name: 'Viewer', description: 'Hanya membaca; tidak bisa mengubah apa pun.' },
}

/** Nama lingkungan tidak diterjemahkan: itu istilah teknis yang dipakai apa adanya. */
export const ENVIRONMENT_LABEL: Record<DeploymentEnvironment, string> = {
  production: 'Production',
  staging: 'Staging',
  sandbox: 'Sandbox',
}

/**
 * Pilihan `<select>` untuk menyaring menurut lingkungan; `''` berarti semuanya.
 *
 * Dirakit dari `ENVIRONMENTS`, bukan diketik ulang, supaya lingkungan baru
 * muncul di setiap penyaring tanpa ada yang perlu diingat. Tipe `value`-nya
 * sengaja tetap sempit (`DeploymentEnvironment | ''`) agar pemanggil bisa
 * mempersempitnya kembali lewat `value !== ''` — tanpa `as` di satu tempat pun.
 */
export const ENVIRONMENT_OPTIONS: readonly { value: DeploymentEnvironment | ''; label: string }[] =
  [
    { value: '', label: 'Semua lingkungan' },
    ...ENVIRONMENTS.map((environment) => ({
      value: environment,
      label: ENVIRONMENT_LABEL[environment],
    })),
  ]

export const numberFormat = new Intl.NumberFormat('id-ID')

const relativeTime = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })

/** `2024-…T10:00:00Z` → `3 menit yang lalu`. */
export const formatAgo = (iso: string): string => {
  const minutes = Math.round((Date.parse(iso) - Date.now()) / 60_000)
  if (Math.abs(minutes) < 60) return relativeTime.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relativeTime.format(hours, 'hour')
  return relativeTime.format(Math.round(hours / 24), 'day')
}

const fullFormat = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

/** Label lengkap untuk tooltip dan halaman detail, tempat ruangnya cukup. */
export const formatFull = (iso: string): string => fullFormat.format(Date.parse(iso))

const clockFormat = new Intl.DateTimeFormat('id-ID', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
})

/** `10:04:37` — untuk baris log, tempat detiknya justru yang penting. */
export const formatClock = (iso: string): string => clockFormat.format(Date.parse(iso))

/**
 * Durasi dalam bentuk yang dibaca manusia: `2m 14s`, bukan `134000`.
 *
 * `null` berarti "belum selesai", dan itu keadaan yang sah — deployment yang
 * masih berjalan memang belum punya durasi. Menggantinya dengan `0` akan
 * menampilkan `0s` untuk sesuatu yang sudah berjalan lima menit.
 */
export const formatDuration = (ms: number | null): string => {
  if (ms === null) return '—'
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes === 0 ? `${String(seconds)}s` : `${String(minutes)}m ${String(seconds)}s`
}
