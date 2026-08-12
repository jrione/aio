/**
 * Pemformat dan label yang dipakai bersama seluruh widget dashboard.
 *
 * Dikumpulkan di sini karena dipakai lebih dari satu widget: tabel aktivitas
 * dan grafik tren sama-sama menampilkan waktu, dan kartu metrik serta tabel
 * sama-sama memformat angka. Menyalinnya ke tiap komponen adalah cara termudah
 * membuat satu tempat memakai `10.000` sementara tempat lain memakai `10,000`.
 *
 * Objek `Intl.*` dibuat sekali di tingkat modul. Membuatnya di dalam render
 * berarti membangun ulang tabel lokalisasi setiap kali komponen dirender —
 * ongkos yang tidak terlihat sampai jumlah barisnya bertambah.
 */
import type {
  Activity,
  ActivityStatus,
  DeploymentEnvironment,
  MetricTone,
} from '@/services/dashboard/dashboard.types.ts'

/** Status dari API bernama Inggris; labelnya untuk pengguna berbahasa Indonesia. */
export const STATUS_LABEL: Record<ActivityStatus, string> = {
  success: 'Berhasil',
  failed: 'Gagal',
  running: 'Berjalan',
}

export const STATUS_TONE: Record<ActivityStatus, MetricTone> = {
  success: 'success',
  failed: 'danger',
  running: 'info',
}

export const KIND_LABEL: Record<Activity['kind'], string> = {
  deployment: 'Deployment',
  pipeline: 'Pipeline',
  incident: 'Insiden',
}

export const ENVIRONMENT_LABEL: Record<DeploymentEnvironment, string> = {
  production: 'Production',
  staging: 'Staging',
  sandbox: 'Sandbox',
}

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

const hourFormat = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })
const fullFormat = new Intl.DateTimeFormat('id-ID', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Label pendek untuk sumbu waktu grafik.
 *
 * Bentuknya ditentukan lebar ember yang dikirim server, bukan ditebak dari
 * jumlah titik: data harian berlabel jam adalah salah satu cara tercepat
 * membuat grafik terlihat benar padahal salah.
 */
export const formatBucket = (iso: string, bucket: 'hour' | 'day'): string =>
  bucket === 'hour' ? hourFormat.format(Date.parse(iso)) : dayFormat.format(Date.parse(iso))

/** Label lengkap untuk tooltip, tempat ruangnya cukup untuk tanggal utuh. */
export const formatFull = (iso: string): string => fullFormat.format(Date.parse(iso))
