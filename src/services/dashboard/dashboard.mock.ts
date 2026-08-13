/**
 * Data tiruan untuk domain dashboard.
 *
 * Diketik dari `dashboard.types.ts` yang sama dengan service-nya, jadi mock
 * yang menyimpang dari kontrak gagal saat `npm run typecheck` — bukan nanti
 * saat backend sungguhan dipasang.
 *
 * Modul ini hanya terjangkau lewat `import()` dinamis di `http.ts`, sehingga
 * seluruh isinya berakhir di chunk terpisah dan tidak membebani bundle utama
 * saat aplikasi memakai API asli.
 *
 * Angkanya sengaja tidak bulat dan waktunya relatif terhadap sekarang: data
 * contoh yang terlalu rapi menyembunyikan masalah tata letak (angka 4 digit,
 * nama layanan panjang) sampai data sungguhan datang.
 *
 * Dua sifat lain yang dijaga di sini, dan keduanya bukan hiasan:
 *
 *   1. **Metrik diturunkan dari tabel aktivitas yang sama.** Kalau ringkasan
 *      ditulis sebagai angka lepas, ia perlahan bertentangan dengan tabel di
 *      bawahnya — dan yang melihat dashboard tiruan yang saling bertentangan
 *      akan menyalahkan kodenya, bukan datanya.
 *   2. **Lingkungan `sandbox` benar-benar kosong.** Keadaan kosong yang tidak
 *      bisa dijangkau lewat UI sama saja dengan tidak pernah diuji.
 */
import type {
  Activity,
  ActivityStatus,
  DashboardSummary,
  DeploymentTrend,
  Metric,
  TrendPoint,
  TrendRange,
} from '@/services/dashboard/dashboard.types.ts'
import { ENVIRONMENTS, type DeploymentEnvironment } from '@/services/environment.ts'
import type { MockRoute } from '@/services/mock/mock-transport.ts'
import { paginate } from '@/services/paginated.ts'

const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString()

/** `[target, lingkungan, pelaku, status, menit lalu, jenis]` */
type ActivityRow = [string, DeploymentEnvironment, string, ActivityStatus, number, Activity['kind']]

const ACTIVITY_ROWS: readonly ActivityRow[] = [
  ['api-gateway', 'production', 'rani.wijaya', 'running', 3, 'deployment'],
  ['billing-service', 'production', 'ci-bot', 'success', 11, 'deployment'],
  ['notification-worker', 'staging', 'bagas.p', 'failed', 24, 'pipeline'],
  ['identity-provider', 'production', 'ci-bot', 'success', 38, 'deployment'],
  ['web-dashboard', 'staging', 'rani.wijaya', 'success', 52, 'deployment'],
  ['payment-reconciliation-batch', 'production', 'ops-oncall', 'failed', 67, 'incident'],
  ['search-indexer', 'staging', 'ci-bot', 'success', 84, 'pipeline'],
  ['api-gateway', 'staging', 'dimas.h', 'success', 96, 'deployment'],
  ['billing-service', 'staging', 'ci-bot', 'success', 118, 'pipeline'],
  ['media-transcoder', 'production', 'ci-bot', 'running', 133, 'pipeline'],
  ['identity-provider', 'staging', 'bagas.p', 'success', 147, 'deployment'],
  ['web-dashboard', 'production', 'rani.wijaya', 'success', 168, 'deployment'],
  ['audit-log-collector', 'production', 'ops-oncall', 'failed', 191, 'incident'],
  ['notification-worker', 'production', 'ci-bot', 'success', 214, 'deployment'],
  ['search-indexer', 'production', 'dimas.h', 'success', 236, 'deployment'],
  ['api-gateway', 'production', 'ci-bot', 'success', 262, 'pipeline'],
  ['media-transcoder', 'staging', 'bagas.p', 'failed', 288, 'pipeline'],
  ['billing-service', 'production', 'rani.wijaya', 'success', 315, 'deployment'],
  ['web-dashboard', 'staging', 'ci-bot', 'success', 344, 'pipeline'],
  ['identity-provider', 'production', 'dimas.h', 'success', 371, 'deployment'],
  ['audit-log-collector', 'staging', 'ci-bot', 'success', 402, 'pipeline'],
  ['payment-reconciliation-batch', 'staging', 'ops-oncall', 'success', 436, 'deployment'],
  ['notification-worker', 'staging', 'ci-bot', 'success', 470, 'pipeline'],
]

const ACTIVITIES = (environment?: DeploymentEnvironment): readonly Activity[] =>
  ACTIVITY_ROWS.filter(([, env]) => environment === undefined || env === environment).map(
    ([target, env, actor, status, minutes, kind], index) => ({
      id: `act-${String(index + 1).padStart(3, '0')}`,
      kind,
      target,
      environment: env,
      actor,
      status,
      at: minutesAgo(minutes),
    }),
  )

/* ─────────────────────────────────────────────────────────────
 * Ringkasan metrik — diturunkan dari tabel di atas
 * ───────────────────────────────────────────────────────────── */

const A_DAY = 24 * 60

const SUMMARY = (environment?: DeploymentEnvironment): DashboardSummary => {
  const rows = ACTIVITY_ROWS.filter(([, env]) => environment === undefined || env === environment)

  // Lingkungan tanpa satu pun catatan tidak punya apa pun untuk diringkas.
  // Mengembalikan empat kartu bernilai nol justru menyesatkan: ia terlihat
  // seperti sistem yang sedang gagal total, bukan seperti tempat yang memang
  // belum pernah dipakai.
  if (rows.length === 0) return { updatedAt: minutesAgo(2), metrics: [] }

  const deploymentsToday = rows.filter(
    ([, , , , minutes, kind]) => kind === 'deployment' && minutes < A_DAY,
  ).length
  const pipelinesRunning = rows.filter(
    ([, , , status, , kind]) => kind === 'pipeline' && status === 'running',
  ).length
  const openIncidents = rows.filter(
    ([, , , status, , kind]) => kind === 'incident' && status === 'failed',
  ).length

  const succeeded = rows.filter(([, , , status]) => status === 'success').length
  const failed = rows.filter(([, , , status]) => status === 'failed').length
  const settled = succeeded + failed
  const successRate = settled === 0 ? 100 : Math.round((succeeded / settled) * 1000) / 10

  const metrics: Metric[] = [
    {
      id: 'deployments',
      label: 'Deployment 24 jam',
      value: deploymentsToday,
      status: deploymentsToday > 0 ? 'sehat' : 'sepi',
      tone: deploymentsToday > 0 ? 'success' : 'info',
    },
    {
      id: 'pipelines',
      label: 'Pipeline berjalan',
      value: pipelinesRunning,
      status: pipelinesRunning > 0 ? 'berjalan' : 'menganggur',
      tone: 'info',
    },
    {
      id: 'success-rate',
      label: 'Tingkat keberhasilan',
      value: successRate,
      unit: '%',
      status: successRate >= 90 ? 'di atas target' : 'di bawah target',
      tone: successRate >= 90 ? 'success' : 'warning',
    },
    {
      id: 'incidents',
      label: 'Insiden terbuka',
      value: openIncidents,
      status: openIncidents > 0 ? 'perlu tindakan' : 'aman',
      tone: openIncidents > 0 ? 'danger' : 'success',
    },
  ]

  return { updatedAt: minutesAgo(2), metrics }
}

/* ─────────────────────────────────────────────────────────────
 * Tren deployment
 * ───────────────────────────────────────────────────────────── */

/**
 * Angka semu yang **tetap sama** untuk ember waktu yang sama.
 *
 * `Math.random()` akan membuat grafik menari setiap kali data diambil ulang —
 * termasuk saat pengguna cuma mengganti penyaring — dan animasi yang seharusnya
 * menandai perubahan sungguhan jadi tidak berarti apa-apa.
 */
const pseudoRandom = (seed: number): number => {
  const value = Math.sin(seed * 12.9898) * 43_758.545
  return value - Math.floor(value)
}

const RANGE_SHAPE: Record<TrendRange, { buckets: number; bucket: 'hour' | 'day'; stepMs: number }> =
  {
    '24h': { buckets: 24, bucket: 'hour', stepMs: 60 * 60 * 1000 },
    '7d': { buckets: 7, bucket: 'day', stepMs: 24 * 60 * 60 * 1000 },
    '30d': { buckets: 30, bucket: 'day', stepMs: 24 * 60 * 60 * 1000 },
  }

/** production paling ramai, staging separuhnya. */
const ENVIRONMENT_WEIGHT: Record<DeploymentEnvironment, number> = {
  production: 1,
  staging: 0.55,
  sandbox: 0,
}

const TREND = (range: TrendRange, environment?: DeploymentEnvironment): DeploymentTrend => {
  const { buckets, bucket, stepMs } = RANGE_SHAPE[range]
  const weight =
    environment === undefined
      ? ENVIRONMENT_WEIGHT.production + ENVIRONMENT_WEIGHT.staging
      : ENVIRONMENT_WEIGHT[environment]

  if (weight === 0) return { range, bucket, points: [] }

  // Ember terakhir dibulatkan ke bawah supaya batasnya stabil di antara dua
  // request yang berdekatan — kalau tidak, titik terakhir bergeser sedikit
  // tiap kali dan sumbu waktunya ikut bergetar.
  const last = Math.floor(Date.now() / stepMs) * stepMs

  const points: TrendPoint[] = Array.from({ length: buckets }, (_, index) => {
    const at = last - (buckets - 1 - index) * stepMs
    const noise = pseudoRandom(at / stepMs)
    const failureNoise = pseudoRandom(at / stepMs + 0.5)

    const scale = bucket === 'hour' ? 9 : 48
    return {
      at: new Date(at).toISOString(),
      succeeded: Math.round((2 + noise * scale) * weight),
      // Kegagalan jarang, dan memang harus begitu: grafik yang setiap embernya
      // punya kegagalan membuat garis merah tidak lagi menarik perhatian.
      failed: failureNoise > 0.72 ? Math.round((1 + failureNoise * 3) * weight) : 0,
    }
  })

  return { range, bucket, points }
}

/* ─────────────────────────────────────────────────────────────
 * Pembacaan query string
 * ───────────────────────────────────────────────────────────── */

/** Membaca angka dari query string, jatuh ke default bila kosong/tidak valid. */
const readNumber = (query: URLSearchParams, key: string): number | undefined => {
  const raw = query.get(key)
  if (raw === null) return undefined
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const ACTIVITY_STATUSES: readonly ActivityStatus[] = ['success', 'failed', 'running']

const readStatus = (query: URLSearchParams): ActivityStatus | undefined => {
  const raw = query.get('status')
  return ACTIVITY_STATUSES.find((status) => status === raw)
}

const readEnvironment = (query: URLSearchParams): DeploymentEnvironment | undefined => {
  const raw = query.get('environment')
  return ENVIRONMENTS.find((environment) => environment === raw)
}

const TREND_RANGES: readonly TrendRange[] = ['24h', '7d', '30d']

const readRange = (query: URLSearchParams): TrendRange =>
  TREND_RANGES.find((range) => range === query.get('range')) ?? '24h'

export const dashboardMockRoutes: readonly MockRoute[] = [
  {
    method: 'GET',
    path: '/dashboard/summary',
    handle: ({ query }) => ({ body: SUMMARY(readEnvironment(query)) }),
  },
  {
    method: 'GET',
    path: '/dashboard/trend',
    handle: ({ query }) => ({ body: TREND(readRange(query), readEnvironment(query)) }),
  },
  {
    method: 'GET',
    path: '/dashboard/activities',
    handle: ({ query }) => {
      const status = readStatus(query)
      const all = ACTIVITIES(readEnvironment(query))
      const filtered =
        status === undefined ? all : all.filter((activity) => activity.status === status)

      return {
        body: paginate(filtered, {
          page: readNumber(query, 'page'),
          pageSize: readNumber(query, 'pageSize'),
        }),
      }
    },
  },
]
