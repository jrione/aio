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
 */
import type {
  Activity,
  ActivityStatus,
  DashboardSummary,
} from '@/services/dashboard/dashboard.types.ts'
import type { MockRoute } from '@/services/mock/mock-transport.ts'
import { paginate } from '@/services/paginated.ts'

const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString()

const SUMMARY = (): DashboardSummary => ({
  updatedAt: minutesAgo(2),
  metrics: [
    {
      id: 'deployments',
      label: 'Deployment hari ini',
      value: 128,
      status: 'sehat',
      tone: 'success',
    },
    { id: 'pipelines', label: 'Pipeline berjalan', value: 7, status: 'berjalan', tone: 'info' },
    {
      id: 'success-rate',
      label: 'Tingkat keberhasilan',
      value: 94.6,
      unit: '%',
      status: 'turun 1,2%',
      tone: 'warning',
    },
    {
      id: 'incidents',
      label: 'Insiden terbuka',
      value: 2,
      status: 'perlu tindakan',
      tone: 'danger',
    },
  ],
})

/** `[target, environment, actor, status, menit lalu, jenis]` */
type ActivityRow = [string, string, string, ActivityStatus, number, Activity['kind']]

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

const ACTIVITIES = (): readonly Activity[] =>
  ACTIVITY_ROWS.map(([target, environment, actor, status, minutes, kind], index) => ({
    id: `act-${String(index + 1).padStart(3, '0')}`,
    kind,
    target,
    environment,
    actor,
    status,
    at: minutesAgo(minutes),
  }))

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

export const dashboardMockRoutes: readonly MockRoute[] = [
  {
    method: 'GET',
    path: '/dashboard/summary',
    handle: () => ({ body: SUMMARY() }),
  },
  {
    method: 'GET',
    path: '/dashboard/activities',
    handle: ({ query }) => {
      const status = readStatus(query)
      const filtered =
        status === undefined
          ? ACTIVITIES()
          : ACTIVITIES().filter((activity) => activity.status === status)

      return {
        body: paginate(filtered, {
          page: readNumber(query, 'page'),
          pageSize: readNumber(query, 'pageSize'),
        }),
      }
    },
  },
]
