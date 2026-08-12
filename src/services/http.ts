/**
 * HTTP client terpusat — satu-satunya tempat di aplikasi yang memanggil
 * `fetch`.
 *
 * Yang diurus di sini, sekali, untuk semua request:
 *   - base URL dari `env.apiBaseUrl`
 *   - timeout dari `env.apiTimeout`, digabung dengan sinyal abort pemanggil
 *   - header `Authorization` dari `auth-token.ts`
 *   - pemberitahuan ke lapisan sesi saat server menjawab `401`
 *   - serialisasi query string & body JSON
 *   - normalisasi seluruh kegagalan jadi `ApiError`
 *
 * Yang **tidak** diurus di sini: bentuk data per domain. Itu tugas
 * `src/services/<domain>/`. Komponen tidak boleh mengimpor file ini — dijaga
 * `npm run check:layers`.
 *
 * Mode mock (`VITE_USE_MOCK=true`) hanya mengganti fungsi `fetch`-nya. Seluruh
 * penanganan status, parsing, dan error di bawah dijalani mock maupun API asli
 * lewat jalur kode yang sama persis, jadi berpindah mode tidak memunculkan
 * perilaku yang belum pernah teruji.
 */
import { env } from '@/config/env.ts'
import { ApiError, toApiError } from '@/services/api-error.ts'
import { getAuthToken } from '@/services/auth-token.ts'
import { signalUnauthorized } from '@/services/unauthorized.ts'

/**
 * Bentuk minimal `fetch` yang dipakai lapisan ini.
 *
 * Didefinisikan di sini, bukan di modul mock, supaya `http.ts` tidak perlu
 * mengimpor nilai apa pun dari `mock/` — lihat `resolveFetch` di bawah.
 */
export type Fetcher = (url: string, init: RequestInit) => Promise<Response>

export type QueryValue = string | number | boolean | null | undefined

export interface RequestOptions {
  /** Parameter query. Entri bernilai `undefined` atau `null` dibuang. */
  query?: Record<string, QueryValue>
  /** Dikirim sebagai JSON. Lewatkan `FormData` untuk unggah berkas. */
  body?: unknown
  /** Diteruskan TanStack Query agar request ikut batal saat query tidak lagi dibutuhkan. */
  signal?: AbortSignal
  headers?: Record<string, string>
  /**
   * Request yang memang tidak membawa sesi: login, refresh, daftar, lupa
   * password.
   *
   * Dua akibatnya, dan yang kedua justru alasan utamanya:
   *   1. header `Authorization` tidak dipasang meski kebetulan ada token sisa;
   *   2. balasan `401` **tidak** dianggap sebagai sesi berakhir.
   *
   * Tanpa (2), salah ketik password akan memicu "sesi Anda sudah berakhir"
   * lalu melempar pengguna ke halaman login — dari halaman login. Dua arti
   * `401` yang sangat berbeda ("kredensial salah" vs "token mati") hanya bisa
   * dibedakan oleh pemanggilnya, jadi di sinilah tempat menyatakannya.
   */
  anonymous?: boolean
  /**
   * Diteruskan apa adanya ke `fetch`. Dipakai `'include'` oleh endpoint refresh
   * supaya cookie `HttpOnly` ikut terkirim meski API berada di origin lain.
   */
  credentials?: RequestCredentials
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Menggabungkan base URL dengan path relatif.
 *
 * `new URL()` tidak dipakai karena `apiBaseUrl` boleh berupa path relatif
 * (`/api`, default-nya) yang bukan URL absolut. Cukup rapikan garis miring di
 * sambungannya supaya `/api` + `/dashboard` tidak jadi `/api//dashboard`.
 */
const buildUrl = (path: string, query?: Record<string, QueryValue>): string => {
  const base = env.apiBaseUrl.replace(/\/+$/, '')
  const suffix = path.startsWith('/') ? path : `/${path}`
  const url = `${base}${suffix}`

  if (!query) return url

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) continue
    params.set(key, String(value))
  }

  const serialized = params.toString()
  return serialized === '' ? url : `${url}?${serialized}`
}

/**
 * Menggabungkan timeout dengan sinyal abort dari pemanggil.
 *
 * Keduanya harus berlaku bersamaan: request batal kalau server kelamaan, dan
 * juga kalau komponennya sudah tidak ada. `AbortSignal.any` menyatukannya.
 */
const buildSignal = (caller?: AbortSignal): AbortSignal => {
  const timeout = AbortSignal.timeout(env.apiTimeout)
  return caller ? AbortSignal.any([timeout, caller]) : timeout
}

/**
 * Membaca body error dari server sebaik mungkin.
 *
 * Backend yang sehat membalas `{ "message": "..." }`. Yang tidak sehat membalas
 * halaman HTML dari reverse proxy. Keduanya harus tidak membuat client ikut
 * meledak, jadi kegagalan membaca body di sini sengaja diabaikan — statusnya
 * sudah cukup untuk menyusun pesan.
 */
const readErrorPayload = async (response: Response): Promise<unknown> => {
  try {
    const text = await response.text()
    if (text === '') return undefined
    try {
      return JSON.parse(text) as unknown
    } catch {
      return text
    }
  } catch {
    return undefined
  }
}

/** Mengambil pesan dari body error bila backend menyediakannya. */
const messageFromPayload = (payload: unknown): string | undefined => {
  if (typeof payload !== 'object' || payload === null) return undefined
  if (!('message' in payload)) return undefined
  const { message } = payload
  return typeof message === 'string' && message !== '' ? message : undefined
}

/**
 * Satu-satunya tempat flag `VITE_USE_MOCK` diperiksa di seluruh aplikasi.
 *
 * Modul mock dimuat lewat `import()` dinamis, bukan impor statis, supaya data
 * tiruan tidak ikut ke dalam bundle utama: Rollup memisahkannya jadi chunk
 * tersendiri yang tidak pernah diminta browser saat flag-nya mati. Promise-nya
 * disimpan (bukan hasilnya) supaya beberapa request yang berbarengan berbagi
 * satu proses pemuatan.
 */
let mockFetchPromise: Promise<Fetcher> | undefined

const resolveFetch = (): Promise<Fetcher> => {
  if (!env.useMock) return Promise.resolve(globalThis.fetch.bind(globalThis))
  mockFetchPromise ??= import('@/services/mock/mock-transport.ts').then(
    (module) => module.mockFetch,
  )
  return mockFetchPromise
}

async function request<Data>(
  method: Method,
  path: string,
  options: RequestOptions = {},
): Promise<Data> {
  const { query, body, signal, headers, anonymous = false, credentials } = options
  const token = anonymous ? null : getAuthToken()

  // FormData menentukan sendiri Content-Type-nya lengkap dengan boundary;
  // menuliskannya manual justru merusak unggahan berkas.
  const isFormData = body instanceof FormData

  const init: RequestInit = {
    method,
    signal: buildSignal(signal),
    ...(credentials === undefined ? {} : { credentials }),
    headers: {
      Accept: 'application/json',
      ...(body !== undefined && !isFormData ? { 'Content-Type': 'application/json' } : {}),
      ...(token === null ? {} : { Authorization: `Bearer ${token}` }),
      ...headers,
    },
  }

  if (body !== undefined) {
    init.body = isFormData ? body : JSON.stringify(body)
  }

  let response: Response
  try {
    const fetcher = await resolveFetch()
    response = await fetcher(buildUrl(path, query), init)
  } catch (error) {
    // Semua kegagalan sebelum respons diterima — jaringan, timeout, abort.
    throw toApiError(error)
  }

  if (!response.ok) {
    /*
     * Sesi berakhir diberitahukan dari sini, bukan dari tiap pemanggil.
     *
     * Kalau tidak, setiap `useQuery` di aplikasi harus ingat memeriksa
     * `error.status === 401` dan memanggil logout sendiri — dan yang lupa
     * tidak akan ketahuan sampai ada pengguna yang tabnya menganggur semalam
     * lalu menemukan halaman penuh pesan error alih-alih halaman login.
     */
    if (response.status === 401 && !anonymous) signalUnauthorized()

    const payload = await readErrorPayload(response)
    throw new ApiError('http', {
      status: response.status,
      message: messageFromPayload(payload),
      payload,
    })
  }

  // 204 No Content dan body kosong itu sah — DELETE yang berhasil tidak wajib
  // mengembalikan apa pun. Memaksa `response.json()` di sini justru melempar.
  if (response.status === 204) return undefined as Data

  const text = await response.text()
  if (text === '') return undefined as Data

  try {
    /*
     * Di sinilah, dan hanya di sini, aplikasi memercayai backend.
     *
     * `JSON.parse` mengembalikan `any`; `Data` adalah klaim tentang bentuk yang
     * dijanjikan endpoint-nya. Tidak ada cara memverifikasi klaim itu tanpa
     * validator runtime (zod dan sejenisnya) — dan itu keputusan tersendiri,
     * bukan bagian Issue #8.
     *
     * Yang bisa dilakukan sekarang adalah membatasi kepercayaan itu pada satu
     * baris. Selama seluruh request lewat sini, menambahkan validasi nanti
     * berarti menyunting satu fungsi, bukan berburu `as` di seluruh service.
     */
    return JSON.parse(text) as Data
  } catch (error) {
    throw new ApiError('parse', { cause: error })
  }
}

export const http = {
  get: <Data>(path: string, options?: Omit<RequestOptions, 'body'>) =>
    request<Data>('GET', path, options),
  post: <Data>(path: string, options?: RequestOptions) => request<Data>('POST', path, options),
  put: <Data>(path: string, options?: RequestOptions) => request<Data>('PUT', path, options),
  patch: <Data>(path: string, options?: RequestOptions) => request<Data>('PATCH', path, options),
  delete: <Data>(path: string, options?: RequestOptions) => request<Data>('DELETE', path, options),
}
