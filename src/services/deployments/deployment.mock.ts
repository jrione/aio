/**
 * Data tiruan untuk modul Deployments.
 *
 * Berbeda dari mock dashboard yang hanya membaca, mock ini **menyimpan
 * perubahan**: daftarnya adalah array yang bisa berubah, dan `POST`, `PATCH`,
 * serta `DELETE` benar-benar mengubahnya. Itu bukan kemewahan — mutasi yang
 * balasannya selalu sama membuat seluruh jalur setelahnya (invalidasi cache,
 * daftar yang bertambah, halaman yang bergeser, tombol yang jadi nonaktif) tidak
 * pernah teruji sampai backend sungguhan dipasang.
 *
 * Perubahannya hidup selama tab terbuka dan hilang saat halaman dimuat ulang.
 * Itu justru bagus: setiap sesi pengembangan mulai dari keadaan yang sama, jadi
 * bug yang muncul hari ini bisa diulang besok.
 *
 * Dua sifat lain yang dijaga, sama seperti di mock dashboard:
 *
 *   1. **Log diturunkan dari deployment-nya sendiri.** Log yang tidak
 *      berhubungan dengan statusnya — "selesai" pada deployment yang gagal —
 *      membuat halaman detail tampak rusak padahal datanya yang mengarang.
 *   2. **Lingkungan `sandbox` benar-benar kosong.** Keadaan kosong yang tidak
 *      bisa dijangkau lewat UI sama saja dengan tidak pernah diuji.
 */
import type {
  Deployment,
  DeploymentDetail,
  DeploymentLogLine,
  DeploymentStatus,
  LogLevel,
  NewDeployment,
} from '@/services/deployments/deployment.types.ts'
import { DEPLOYMENT_STATUSES } from '@/services/deployments/deployment.types.ts'
import { ENVIRONMENTS, type DeploymentEnvironment } from '@/services/environment.ts'
import type { MockRoute } from '@/services/mock/mock-transport.ts'
import { paginate } from '@/services/paginated.ts'

const minutesAgo = (minutes: number): string =>
  new Date(Date.now() - minutes * 60_000).toISOString()

/** `[layanan, lingkungan, versi, branch, status, pemicu, menit lalu, detik proses]` */
type SeedRow = [
  string,
  DeploymentEnvironment,
  string,
  string,
  DeploymentStatus,
  string,
  number,
  number | null,
]

const SEED_ROWS: readonly SeedRow[] = [
  ['api-gateway', 'production', 'v4.12.0', 'main', 'running', 'rani.wijaya', 3, null],
  ['billing-service', 'production', 'v2.8.1', 'main', 'succeeded', 'ci-bot', 11, 134],
  ['notification-worker', 'staging', 'v1.19.4', 'feat/retry-queue', 'failed', 'bagas.p', 24, 47],
  ['identity-provider', 'production', 'v3.3.7', 'main', 'succeeded', 'ci-bot', 38, 212],
  ['web-dashboard', 'staging', 'v6.1.0', 'release/6.1', 'succeeded', 'rani.wijaya', 52, 96],
  [
    'payment-reconciliation-batch',
    'production',
    'v1.4.2',
    'hotfix/rounding',
    'failed',
    'ops-oncall',
    67,
    18,
  ],
  ['search-indexer', 'staging', 'v0.22.9', 'main', 'succeeded', 'ci-bot', 84, 301],
  ['api-gateway', 'staging', 'v4.12.0', 'main', 'succeeded', 'dimas.h', 96, 121],
  ['billing-service', 'staging', 'v2.8.1', 'main', 'succeeded', 'ci-bot', 118, 128],
  ['media-transcoder', 'production', 'v5.0.3', 'main', 'queued', 'ci-bot', 133, null],
  ['identity-provider', 'staging', 'v3.3.7', 'main', 'succeeded', 'bagas.p', 147, 205],
  ['web-dashboard', 'production', 'v6.0.9', 'main', 'succeeded', 'rani.wijaya', 168, 88],
  ['audit-log-collector', 'production', 'v1.1.0', 'main', 'canceled', 'ops-oncall', 191, 9],
  ['notification-worker', 'production', 'v1.19.3', 'main', 'succeeded', 'ci-bot', 214, 52],
  ['search-indexer', 'production', 'v0.22.8', 'main', 'succeeded', 'dimas.h', 236, 288],
  ['api-gateway', 'production', 'v4.11.6', 'main', 'succeeded', 'ci-bot', 262, 117],
  ['media-transcoder', 'staging', 'v5.0.2', 'feat/hls', 'failed', 'bagas.p', 288, 63],
  ['billing-service', 'production', 'v2.8.0', 'main', 'succeeded', 'rani.wijaya', 315, 141],
  ['web-dashboard', 'staging', 'v6.0.9', 'main', 'succeeded', 'ci-bot', 344, 92],
  ['identity-provider', 'production', 'v3.3.6', 'main', 'succeeded', 'dimas.h', 371, 198],
  ['audit-log-collector', 'staging', 'v1.0.8', 'main', 'succeeded', 'ci-bot', 402, 71],
  [
    'payment-reconciliation-batch',
    'staging',
    'v1.4.1',
    'main',
    'succeeded',
    'ops-oncall',
    436,
    164,
  ],
  ['notification-worker', 'staging', 'v1.19.2', 'main', 'succeeded', 'ci-bot', 470, 44],
  ['search-indexer', 'staging', 'v0.22.7', 'main', 'canceled', 'bagas.p', 512, 6],
  ['api-gateway', 'staging', 'v4.11.6', 'main', 'succeeded', 'dimas.h', 559, 113],
  ['media-transcoder', 'production', 'v5.0.2', 'main', 'succeeded', 'ci-bot', 604, 356],
  ['web-dashboard', 'production', 'v6.0.8', 'main', 'failed', 'rani.wijaya', 661, 31],
  ['billing-service', 'staging', 'v2.7.9', 'main', 'succeeded', 'ci-bot', 718, 126],
]

/**
 * SHA commit semu yang tetap sama untuk baris yang sama.
 *
 * Sama alasannya seperti `pseudoRandom` di mock dashboard: nilai yang berubah
 * tiap request membuat pengguna mengira ada sesuatu yang benar-benar berubah.
 */
const fakeCommit = (seed: number): string =>
  Math.abs(Math.sin(seed * 78.233) * 43_758.545)
    .toString(16)
    .replace('.', '')
    .slice(0, 7)

/**
 * Daftar yang bisa berubah — inilah "database"-nya.
 *
 * `let` dengan array baru saat berubah, bukan `push`/`splice` di tempat: dengan
 * begitu tidak ada balasan yang pernah dikirim sebelumnya yang isinya ikut
 * berubah belakangan, persis seperti server sungguhan yang tiap balasannya
 * adalah salinan.
 */
let deployments: readonly Deployment[] = SEED_ROWS.map(
  (
    [service, environment, version, branch, status, triggeredBy, minutes, durationSeconds],
    index,
  ) => ({
    id: `dep-${String(index + 1).padStart(3, '0')}`,
    service,
    environment,
    version,
    commit: fakeCommit(index + 1),
    branch,
    status,
    triggeredBy,
    startedAt: minutesAgo(minutes),
    durationMs: durationSeconds === null ? null : durationSeconds * 1000,
  }),
)

/** Layanan yang bisa dirilis, diurutkan dan tanpa duplikat. */
const SERVICES: readonly string[] = [...new Set(SEED_ROWS.map(([service]) => service))].sort(
  (left, right) => left.localeCompare(right, 'id-ID'),
)

/* ─────────────────────────────────────────────────────────────
 * Log — diturunkan dari deployment-nya
 * ───────────────────────────────────────────────────────────── */

/** Tahap yang dilalui setiap deployment sebelum sampai ke hasil akhirnya. */
const STAGES: readonly string[] = [
  'Mengambil artefak dari registry',
  'Memverifikasi checksum artefak',
  'Menyiapkan konfigurasi lingkungan',
  'Menjalankan migrasi basis data',
  'Menggulirkan replika baru (1/3)',
  'Menggulirkan replika baru (2/3)',
  'Menggulirkan replika baru (3/3)',
  'Menunggu health check lolos',
]

/**
 * Berapa banyak tahap yang sempat dilalui sebelum berhenti.
 *
 * Deployment yang gagal berhenti di tengah, yang dibatalkan berhenti lebih
 * awal lagi, yang mengantre belum mulai sama sekali. Log sepanjang penuh untuk
 * deployment yang gagal di detik ke-18 adalah data yang berbohong.
 */
const reachedStages = (status: DeploymentStatus): number => {
  if (status === 'queued') return 0
  if (status === 'canceled') return 2
  if (status === 'failed') return 5
  if (status === 'running') return 4
  return STAGES.length
}

const buildLog = (deployment: Deployment): readonly DeploymentLogLine[] => {
  const started = Date.parse(deployment.startedAt)
  const reached = reachedStages(deployment.status)

  const lines: DeploymentLogLine[] = [
    {
      at: new Date(started).toISOString(),
      level: 'info',
      message: `Deployment ${deployment.version} (${deployment.commit}) dimulai oleh ${deployment.triggeredBy}.`,
    },
    ...STAGES.slice(0, reached).map((message, index): DeploymentLogLine => {
      const level: LogLevel = message.startsWith('Menjalankan migrasi') ? 'warn' : 'info'
      return { at: new Date(started + (index + 1) * 9_000).toISOString(), level, message }
    }),
  ]

  const closing: Record<DeploymentStatus, DeploymentLogLine | undefined> = {
    queued: {
      at: new Date(started).toISOString(),
      level: 'info',
      message: 'Menunggu antrean runner tersedia.',
    },
    running: undefined,
    succeeded: {
      at: new Date(started + (deployment.durationMs ?? 0)).toISOString(),
      level: 'info',
      message: 'Seluruh replika sehat. Deployment selesai.',
    },
    failed: {
      at: new Date(started + (deployment.durationMs ?? 0)).toISOString(),
      level: 'error',
      message: 'Health check gagal pada 2 dari 3 replika. Menggulirkan balik ke versi sebelumnya.',
    },
    canceled: {
      at: new Date(started + (deployment.durationMs ?? 0)).toISOString(),
      level: 'warn',
      message: `Dibatalkan oleh ${deployment.triggeredBy} sebelum penggulirannya selesai.`,
    },
  }

  const last = closing[deployment.status]
  return last ? [...lines, last] : lines
}

const toDetail = (deployment: Deployment): DeploymentDetail => ({
  ...deployment,
  log: buildLog(deployment),
  history: deployments
    .filter(
      (other) =>
        other.id !== deployment.id &&
        other.service === deployment.service &&
        other.environment === deployment.environment,
    )
    .slice(0, 5),
})

/* ─────────────────────────────────────────────────────────────
 * Pembacaan query string
 * ───────────────────────────────────────────────────────────── */

const readNumber = (query: URLSearchParams, key: string): number | undefined => {
  const raw = query.get(key)
  if (raw === null) return undefined
  const parsed = Number(raw)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

const readEnvironment = (query: URLSearchParams): DeploymentEnvironment | undefined => {
  const raw = query.get('env')
  return ENVIRONMENTS.find((environment) => environment === raw)
}

const readStatus = (query: URLSearchParams): DeploymentStatus | undefined => {
  const raw = query.get('status')
  return DEPLOYMENT_STATUSES.find((status) => status === raw)
}

/**
 * Pencarian bebas atas beberapa kolom sekaligus.
 *
 * Dicocokkan sebagai substring tanpa memperhatikan huruf besar-kecil, karena
 * itulah yang diharapkan orang saat mengetik `bill` di kotak pencarian. Backend
 * sungguhan biasanya menyerahkannya ke indeks pencarian; yang penting sama
 * adalah **kolom mana** yang ikut dicari, dan itu terbaca jelas di sini.
 */
const matchesQuery = (deployment: Deployment, needle: string): boolean => {
  const haystack = [
    deployment.service,
    deployment.version,
    deployment.commit,
    deployment.branch,
    deployment.triggeredBy,
  ]
    .join(' ')
    .toLowerCase()
  return haystack.includes(needle.toLowerCase())
}

/* ─────────────────────────────────────────────────────────────
 * Validasi masukan
 * ───────────────────────────────────────────────────────────── */

/** Tag rilis semantik: `v2.14.3`. */
const VERSION_PATTERN = /^v\d+\.\d+\.\d+$/

/**
 * Membaca body `POST` tanpa satu pun `as`.
 *
 * Body datang dari luar dan bertipe `unknown`; mempersempitnya lewat `in` dan
 * `typeof` adalah satu-satunya cara yang benar-benar memeriksa, bukan sekadar
 * meyakinkan compiler. Pola yang sama dipakai di `auth.mock.ts`.
 */
const readNewDeployment = (
  body: unknown,
): { input?: NewDeployment; errors: Record<string, string> } => {
  const source: object = typeof body === 'object' && body !== null ? body : {}

  const service =
    'service' in source && typeof source.service === 'string' ? source.service.trim() : ''
  const version =
    'version' in source && typeof source.version === 'string' ? source.version.trim() : ''
  const rawEnvironment = 'environment' in source ? source.environment : undefined
  const environment = ENVIRONMENTS.find((candidate) => candidate === rawEnvironment)

  const errors: Record<string, string> = {}
  if (service === '') errors.service = 'Pilih layanan yang akan dirilis.'
  else if (!SERVICES.includes(service)) errors.service = 'Layanan tidak dikenal.'
  if (environment === undefined) errors.environment = 'Pilih lingkungan tujuan.'
  if (version === '') errors.version = 'Versi wajib diisi.'
  else if (!VERSION_PATTERN.test(version)) errors.version = 'Format versi harus seperti v1.2.3.'

  if (Object.keys(errors).length > 0 || environment === undefined) return { errors }
  return { input: { service, environment, version }, errors }
}

/** Id berurut yang tidak bentrok dengan seed maupun dengan yang sudah dibuat. */
let nextId = SEED_ROWS.length + 1

/* ─────────────────────────────────────────────────────────────
 * Route
 * ───────────────────────────────────────────────────────────── */

export const deploymentMockRoutes: readonly MockRoute[] = [
  {
    method: 'GET',
    path: '/deployments',
    handle: ({ query }) => {
      const environment = readEnvironment(query)
      const status = readStatus(query)
      const q = query.get('q')?.trim() ?? ''

      const filtered = deployments.filter(
        (deployment) =>
          (environment === undefined || deployment.environment === environment) &&
          (status === undefined || deployment.status === status) &&
          (q === '' || matchesQuery(deployment, q)),
      )

      return {
        body: paginate(filtered, {
          page: readNumber(query, 'page'),
          pageSize: readNumber(query, 'pageSize'),
        }),
      }
    },
  },

  /*
   * Harus berada **di atas** `/deployments/:id`.
   *
   * Pencocok route di `mock-transport.ts` memakai yang cocok pertama, dan
   * `:id` juga cocok dengan segmen literal `services` — persis seperti router
   * server sungguhan. Menaruhnya di bawah berarti dialog "Deployment baru"
   * diam-diam meminta detail deployment bernama "services".
   */
  {
    method: 'GET',
    path: '/deployments/services',
    handle: () => ({ body: SERVICES }),
  },

  {
    method: 'GET',
    path: '/deployments/:id',
    handle: ({ params }) => {
      const found = deployments.find((deployment) => deployment.id === params.id)
      if (!found) return { status: 404, body: { message: 'Deployment tidak ditemukan.' } }
      return { body: toDetail(found) }
    },
  },

  {
    method: 'POST',
    path: '/deployments',
    handle: ({ body, user }) => {
      const { input, errors } = readNewDeployment(body)
      if (!input) return { status: 422, body: { errors } }

      const created: Deployment = {
        id: `dep-${String(nextId++).padStart(3, '0')}`,
        service: input.service,
        environment: input.environment,
        version: input.version,
        commit: fakeCommit(nextId),
        branch: 'main',
        status: 'queued',
        triggeredBy: user?.email.split('@')[0] ?? 'tidak diketahui',
        startedAt: new Date().toISOString(),
        durationMs: null,
      }

      deployments = [created, ...deployments]
      return { status: 201, body: created }
    },
  },

  {
    method: 'PATCH',
    path: '/deployments/:id',
    handle: ({ params }) => {
      const found = deployments.find((deployment) => deployment.id === params.id)
      if (!found) return { status: 404, body: { message: 'Deployment tidak ditemukan.' } }

      // Yang sudah selesai tidak bisa dibatalkan. Server yang memutuskan ini,
      // bukan tombol di UI: tombol yang disembunyikan tetap bisa dilewati, dan
      // dua pengguna bisa menekannya di detik yang sama.
      if (found.status !== 'queued' && found.status !== 'running') {
        return {
          status: 409,
          body: { message: 'Deployment ini sudah selesai dan tidak bisa dibatalkan.' },
        }
      }

      const canceled: Deployment = {
        ...found,
        status: 'canceled',
        durationMs: Date.now() - Date.parse(found.startedAt),
      }
      deployments = deployments.map((deployment) =>
        deployment.id === canceled.id ? canceled : deployment,
      )
      return { body: canceled }
    },
  },

  {
    method: 'DELETE',
    path: '/deployments/:id',
    handle: ({ params }) => {
      const exists = deployments.some((deployment) => deployment.id === params.id)
      if (!exists) return { status: 404, body: { message: 'Deployment tidak ditemukan.' } }

      deployments = deployments.filter((deployment) => deployment.id !== params.id)
      return { status: 204 }
    },
  },
]
