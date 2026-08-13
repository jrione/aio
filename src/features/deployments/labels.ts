/**
 * Label dan nada warna khusus modul Deployments.
 *
 * Status datang dari API dalam bahasa Inggris; yang dilihat pengguna berbahasa
 * Indonesia. Pemetaannya ditulis sekali di sini, bukan di tiap tempat status
 * ditampilkan, supaya "Berhasil" di tabel tidak pernah jadi "Sukses" di halaman
 * detail — dan supaya menambah status keenam berarti menyunting satu file.
 */
import type { BadgeProps } from '@/components/ui/Badge.tsx'
import {
  DEPLOYMENT_STATUSES,
  type DeploymentStatus,
  type LogLevel,
} from '@/services/deployments/deployment.types.ts'

/** Nada `<Badge>` yang tersedia, dibaca dari komponennya sendiri. */
type Tone = NonNullable<BadgeProps['tone']>

export const DEPLOYMENT_STATUS_LABEL: Record<DeploymentStatus, string> = {
  queued: 'Mengantre',
  running: 'Berjalan',
  succeeded: 'Berhasil',
  failed: 'Gagal',
  canceled: 'Dibatalkan',
}

/**
 * Dibatalkan bernada netral, bukan merah.
 *
 * Merah berarti "ada yang rusak dan perlu dilihat". Deployment yang dibatalkan
 * orang tidak rusak — dan kalau ia ikut merah, warna merah berhenti berarti
 * apa pun saat dilirik sekilas dari kejauhan.
 */
export const DEPLOYMENT_STATUS_TONE: Record<DeploymentStatus, Tone> = {
  queued: 'neutral',
  running: 'info',
  succeeded: 'success',
  failed: 'danger',
  canceled: 'neutral',
}

/** Pilihan `<select>` penyaring status; `''` berarti semua status. */
export const DEPLOYMENT_STATUS_OPTIONS: readonly { value: DeploymentStatus | ''; label: string }[] =
  [
    { value: '', label: 'Semua status' },
    ...DEPLOYMENT_STATUSES.map((status) => ({
      value: status,
      label: DEPLOYMENT_STATUS_LABEL[status],
    })),
  ]

/** Warna teks baris log menurut tingkatnya. */
export const LOG_LEVEL_CLASS: Record<LogLevel, string> = {
  info: 'text-content',
  warn: 'text-warning-strong',
  error: 'text-danger-strong',
}

/** Dibaca screen reader di depan baris log, karena warnanya tidak terbaca. */
export const LOG_LEVEL_LABEL: Record<LogLevel, string> = {
  info: 'Info',
  warn: 'Peringatan',
  error: 'Kesalahan',
}

/**
 * Status yang masih bisa dibatalkan.
 *
 * Dipakai UI untuk memutuskan tombol "Batalkan" muncul atau tidak. Server tetap
 * memeriksanya sendiri dan menjawab `409` bila terlambat — dua pengguna bisa
 * menekan tombol yang sama di detik yang sama, dan yang di layar sudah usang
 * sejak sepersekian detik lalu.
 */
export const isCancelable = (status: DeploymentStatus): boolean =>
  status === 'queued' || status === 'running'
