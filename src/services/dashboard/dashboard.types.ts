/**
 * Kontrak data domain dashboard.
 *
 * File ini adalah kesepakatan antara backend, service, mock, dan UI. Mock dan
 * service sama-sama mengetiknya dari sini, jadi data tiruan yang menyimpang
 * dari bentuk sungguhannya gagal saat type check — bukan saat backend dipasang.
 *
 * `DeploymentEnvironment` dan `EnvironmentFilter` dulu tinggal di sini juga.
 * Sejak modul Deployments (Issue #12) ikut memakainya, keduanya pindah ke
 * `@/services/environment.ts` — kosakata yang dipakai dua domain tidak boleh
 * dimiliki salah satunya.
 */
import type { DeploymentEnvironment, EnvironmentFilter } from '@/services/environment.ts'

/** Nada visual metrik, dipetakan langsung ke `tone` pada `<Badge>`. */
export type MetricTone = 'success' | 'warning' | 'danger' | 'info'

export interface Metric {
  readonly id: string
  readonly label: string
  readonly value: number
  /** Satuan yang ditempel di belakang angka, mis. `%` atau `menit`. */
  readonly unit?: string
  /** Keterangan singkat di sebelah angka, mis. `sehat`. */
  readonly status: string
  readonly tone: MetricTone
}

export interface DashboardSummary {
  readonly metrics: readonly Metric[]
  /** ISO 8601. Kapan angka di atas terakhir dihitung server. */
  readonly updatedAt: string
}

export type ActivityStatus = 'success' | 'failed' | 'running'

export type ActivityKind = 'deployment' | 'pipeline' | 'incident'

export interface Activity {
  readonly id: string
  readonly kind: ActivityKind
  /** Nama layanan atau repositori yang terpengaruh. */
  readonly target: string
  readonly environment: DeploymentEnvironment
  readonly actor: string
  readonly status: ActivityStatus
  /** ISO 8601. */
  readonly at: string
}

export interface ActivityFilter extends EnvironmentFilter {
  page?: number
  pageSize?: number
  /** Kosongkan untuk semua status. */
  status?: ActivityStatus
}

/**
 * Rentang waktu grafik tren.
 *
 * Serangkaian nilai tetap, bukan pasangan tanggal bebas. Yang ditanyakan
 * pengguna dashboard operasional hampir selalu "sehari terakhir bagaimana?",
 * dan rentang tetap membuat server bisa menjawabnya dari agregat yang sudah
 * dihitung. Pemilih tanggal bebas menuntut agregasi dadakan untuk pertanyaan
 * yang jarang benar-benar diajukan.
 */
export type TrendRange = '24h' | '7d' | '30d'

export interface TrendPoint {
  /** ISO 8601, awal dari satu ember waktu (jam atau hari). */
  readonly at: string
  readonly succeeded: number
  readonly failed: number
}

export interface TrendFilter extends EnvironmentFilter {
  range: TrendRange
}

export interface DeploymentTrend {
  readonly range: TrendRange
  /**
   * Lebar satu ember. UI memakainya untuk memilih format label sumbu — server
   * yang memutuskan datanya per jam atau per hari, bukan komponen yang menebak
   * dari jumlah titik.
   */
  readonly bucket: 'hour' | 'day'
  readonly points: readonly TrendPoint[]
}
