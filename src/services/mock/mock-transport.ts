/**
 * Backend tiruan yang menyamar sebagai `fetch`.
 *
 * Keputusan bentuknya penting: mock dipasang di **lapisan transport**, bukan di
 * lapisan service. Artinya tidak ada service yang punya dua implementasi.
 * `dashboardService` ditulis sekali, memanggil `http` sekali, dan yang berbeda
 * antara mode mock dan API asli hanya fungsi `fetch` yang dipakai di dalam
 * `http.ts`.
 *
 * Kalau mock dipasang di lapisan service — `useMock ? mockService : apiService`
 * — kedua implementasi itu akan menyimpang perlahan tanpa ada yang sadar, dan
 * seluruh penanganan status HTTP, parsing, serta error di `http.ts` tidak
 * pernah dilewati sama sekali selama pengembangan. Dengan cara ini, mematikan
 * flag mock tidak menjalankan satu baris kode pun yang belum pernah dijalankan.
 *
 * Handler membalas `{ status, body }`, lalu dibungkus jadi `Response` sungguhan
 * supaya `http.ts` memperlakukannya persis seperti jawaban server.
 */
import { env } from '@/config/env.ts'
import type { Fetcher } from '@/services/http.ts'
import { MOCK_ROUTES } from '@/services/mock/routes.ts'

export interface MockContext {
  /** Segmen dinamis dari pola route, mis. `:id` pada `/deployments/:id`. */
  readonly params: Readonly<Record<string, string>>
  readonly query: URLSearchParams
  /** Body request yang sudah di-parse dari JSON. `undefined` bila tanpa body. */
  readonly body: unknown
}

export interface MockResult {
  /** Default 200, atau 204 bila `body` tidak diisi. */
  status?: number
  /** Dikirim sebagai JSON. Kosongkan untuk balasan tanpa isi. */
  body?: unknown
}

export type MockHandler = (context: MockContext) => MockResult | Promise<MockResult>

export interface MockRoute {
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  /**
   * Pola path **tanpa** base URL, mis. `/dashboard/activities`. Base-nya
   * dipotong di sini supaya mengganti `VITE_API_BASE_URL` tidak menuntut
   * seluruh pola route ikut diubah.
   */
  readonly path: string
  readonly handle: MockHandler
}

/**
 * Jeda buatan sebelum membalas.
 *
 * Bukan hiasan: tanpa jeda, setiap request mock selesai di microtask yang sama
 * sehingga state `isPending` tidak pernah sempat terlihat. Skeleton dan spinner
 * jadi tidak pernah teruji selama pengembangan, lalu baru ketahuan patah saat
 * dipasang ke backend sungguhan.
 */
const LATENCY_MS = 320

const delay = (signal: AbortSignal | null | undefined): Promise<void> =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(resolve, LATENCY_MS)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        // Nama 'AbortError' penting: `toApiError` membedakan pembatalan dari
        // timeout lewat nama ini, persis seperti yang dilakukan `fetch` asli.
        reject(new DOMException('Permintaan dibatalkan', 'AbortError'))
      },
      { once: true },
    )
  })

/** Base palsu untuk mem-parse URL relatif seperti `/api/dashboard?page=2`. */
const PARSE_BASE = 'http://mock.local'

/** Membuang prefiks base URL agar pola route bisa ditulis tanpa `/api`. */
const stripBase = (pathname: string): string => {
  const base = env.apiBaseUrl.replace(/\/+$/, '')
  if (base === '' || !pathname.startsWith(base)) return pathname
  const rest = pathname.slice(base.length)
  return rest.startsWith('/') ? rest : `/${rest}`
}

/**
 * Mencocokkan pola route dengan path sungguhan.
 *
 * Sengaja tidak memakai regex hasil rakitan string: memecah per segmen lebih
 * mudah dibaca dan tidak punya sudut gelap soal escaping.
 */
const matchPath = (
  pattern: string,
  pathname: string,
): Readonly<Record<string, string>> | undefined => {
  const patternSegments = pattern.split('/').filter((segment) => segment !== '')
  const pathSegments = pathname.split('/').filter((segment) => segment !== '')
  if (patternSegments.length !== pathSegments.length) return undefined

  const params: Record<string, string> = {}
  for (const [index, segment] of patternSegments.entries()) {
    const actual = pathSegments[index]
    if (segment.startsWith(':')) {
      params[segment.slice(1)] = decodeURIComponent(actual)
      continue
    }
    if (segment !== actual) return undefined
  }
  return params
}

const parseBody = (body: BodyInit | null | undefined): unknown => {
  if (typeof body !== 'string' || body === '') return undefined
  try {
    return JSON.parse(body) as unknown
  } catch {
    return body
  }
}

/**
 * Implementasi `fetch` yang membaca `MOCK_ROUTES`.
 *
 * Diekspor sebagai satu-satunya nilai yang dipakai `http.ts`, lewat
 * `import()` dinamis — lihat catatan di sana.
 */
export const mockFetch: Fetcher = async (url, init) => {
  const method = init.method ?? 'GET'
  const parsed = new URL(url, PARSE_BASE)
  const pathname = stripBase(parsed.pathname)

  const matched = MOCK_ROUTES.filter((route) => route.method === method)
    .map((route) => ({ route, params: matchPath(route.path, pathname) }))
    .find((entry): entry is { route: MockRoute; params: Record<string, string> } =>
      Boolean(entry.params),
    )

  // Jeda dijalankan lebih dulu, termasuk untuk route yang tidak ada — 404 dari
  // server sungguhan juga butuh waktu tempuh, dan UI harus tahan menghadapinya.
  await delay(init.signal)

  if (!matched) {
    return Response.json(
      { message: `Mock belum punya handler untuk ${method} ${pathname}.` },
      { status: 404 },
    )
  }

  const result = await matched.route.handle({
    params: matched.params,
    query: parsed.searchParams,
    body: parseBody(init.body),
  })

  if (result.body === undefined) return new Response(null, { status: result.status ?? 204 })
  return Response.json(result.body, { status: result.status ?? 200 })
}
