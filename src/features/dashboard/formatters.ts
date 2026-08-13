/**
 * Label dan pemformat yang hanya dipakai widget dashboard.
 *
 * Yang dipakai bersama fitur lain — nama lingkungan, format angka, waktu
 * relatif — ada di `src/features/formatters.ts`. Pemisahannya bukan soal rapi:
 * selama sebuah label hanya punya satu pemakai, ia boleh berubah tanpa
 * memikirkan siapa pun; begitu ia dipakai dua fitur, perubahannya jadi urusan
 * bersama dan tempatnya pun ikut pindah.
 */
import type { Activity, ActivityStatus, MetricTone } from '@/services/dashboard/dashboard.types.ts'

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

const hourFormat = new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit' })
const dayFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })

/**
 * Label pendek untuk sumbu waktu grafik.
 *
 * Bentuknya ditentukan lebar ember yang dikirim server, bukan ditebak dari
 * jumlah titik: data harian berlabel jam adalah salah satu cara tercepat
 * membuat grafik terlihat benar padahal salah.
 */
export const formatBucket = (iso: string, bucket: 'hour' | 'day'): string =>
  bucket === 'hour' ? hourFormat.format(Date.parse(iso)) : dayFormat.format(Date.parse(iso))
