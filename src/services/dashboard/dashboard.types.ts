/**
 * Kontrak data domain dashboard.
 *
 * File ini adalah kesepakatan antara backend, service, mock, dan UI. Mock dan
 * service sama-sama mengetiknya dari sini, jadi data tiruan yang menyimpang
 * dari bentuk sungguhannya gagal saat type check — bukan saat backend dipasang.
 */

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
  readonly environment: string
  readonly actor: string
  readonly status: ActivityStatus
  /** ISO 8601. */
  readonly at: string
}

export interface ActivityFilter {
  page?: number
  pageSize?: number
  /** Kosongkan untuk semua status. */
  status?: ActivityStatus
}
