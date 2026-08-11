/**
 * Bentuk error tunggal untuk seluruh lapisan data.
 *
 * Tanpa ini, setiap pemanggil harus menebak apa yang ditangkapnya: `fetch`
 * melempar `TypeError` saat jaringan mati, `AbortSignal.timeout()` melempar
 * `DOMException` bernama TimeoutError, backend membalas JSON, dan proxy yang
 * salah konfigurasi membalas HTML. Empat bentuk berbeda untuk satu konsep yang
 * sama — "request gagal" — dan UI mustahil menampilkannya seragam.
 *
 * `http.ts` menormalkan semuanya jadi `ApiError` sebelum melemparnya keluar,
 * jadi komponen cukup tahu satu tipe dan satu properti: `error.message` sudah
 * berbahasa Indonesia dan layak ditampilkan apa adanya.
 */

/**
 * Sebab kegagalan. Dipisah dari status HTTP karena keputusan yang diambil UI
 * berbeda: `timeout` dan `network` layak dicoba ulang, `http` 4xx tidak.
 */
export type ApiErrorKind =
  /** Request tidak sampai ke server: koneksi putus, DNS gagal, CORS ditolak. */
  | 'network'
  /** Server tidak menjawab dalam `VITE_API_TIMEOUT`. */
  | 'timeout'
  /** Server menjawab dengan status di luar 2xx. */
  | 'http'
  /** Server menjawab 2xx tapi isinya bukan JSON yang bisa dibaca. */
  | 'parse'
  /** Dibatalkan pemanggil — komponen unmount, query key berubah. */
  | 'canceled'

/** Pesan default per sebab. Dipakai bila server tidak memberi pesan sendiri. */
const DEFAULT_MESSAGE: Record<ApiErrorKind, string> = {
  network: 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
  timeout: 'Server terlalu lama merespons. Coba lagi sebentar lagi.',
  http: 'Server mengembalikan kesalahan.',
  parse: 'Respons server tidak dapat dibaca.',
  canceled: 'Permintaan dibatalkan.',
}

/** Pesan untuk status HTTP yang punya arti khusus bagi pengguna. */
const HTTP_MESSAGE: Record<number, string> = {
  400: 'Permintaan tidak valid.',
  401: 'Sesi Anda sudah berakhir. Silakan masuk kembali.',
  403: 'Anda tidak punya akses ke data ini.',
  404: 'Data yang diminta tidak ditemukan.',
  409: 'Data sudah berubah di server. Muat ulang lalu coba lagi.',
  422: 'Data yang dikirim tidak lolos validasi server.',
  429: 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.',
  500: 'Terjadi kesalahan di server.',
  502: 'Server sedang tidak dapat dihubungi.',
  503: 'Layanan sedang tidak tersedia.',
  504: 'Server terlalu lama merespons.',
}

export interface ApiErrorOptions {
  /** Pesan siap tampil. Bila kosong, diambil dari status lalu dari `kind`. */
  message?: string
  /** Status HTTP, hanya untuk `kind: 'http'`. */
  status?: number
  /** Body mentah dari server — untuk logging & validasi form, bukan untuk ditampilkan. */
  payload?: unknown
  cause?: unknown
}

export class ApiError extends Error {
  readonly kind: ApiErrorKind
  readonly status?: number
  readonly payload?: unknown

  constructor(kind: ApiErrorKind, options: ApiErrorOptions = {}) {
    const message =
      options.message ??
      (options.status === undefined ? undefined : HTTP_MESSAGE[options.status]) ??
      DEFAULT_MESSAGE[kind]

    super(message, { cause: options.cause })
    this.name = 'ApiError'
    this.kind = kind
    this.status = options.status
    this.payload = options.payload
  }

  /**
   * Layak dicoba ulang secara otomatis?
   *
   * 4xx berarti permintaannya sendiri yang salah — mengulanginya persis sama
   * akan gagal persis sama. 5xx dan gangguan jaringan bersifat sementara.
   * Dipakai `query-client.ts` untuk menentukan kebijakan retry, jadi aturannya
   * hanya ditulis sekali di sini.
   */
  get retryable(): boolean {
    if (this.kind === 'canceled') return false
    if (this.kind !== 'http') return true
    if (this.status === undefined) return true
    // 408 (Request Timeout) dan 429 (Too Many Requests) memang mengundang
    // percobaan ulang meski keduanya 4xx.
    if (this.status === 408 || this.status === 429) return true
    return this.status >= 500
  }
}

/**
 * Membungkus apa pun yang tertangkap jadi `ApiError`.
 *
 * Dipakai di batas lapisan (http client, error boundary) supaya tidak ada
 * `unknown` yang lolos ke UI. Error yang sudah `ApiError` dilewatkan apa adanya
 * agar `kind` dan `status` aslinya tidak hilang.
 */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (error instanceof DOMException) {
    // AbortSignal.timeout() melempar TimeoutError; abort dari pemanggil
    // melempar AbortError. Keduanya DOMException, hanya namanya yang beda.
    if (error.name === 'TimeoutError') return new ApiError('timeout', { cause: error })
    if (error.name === 'AbortError') return new ApiError('canceled', { cause: error })
  }

  // `fetch` melempar TypeError untuk semua kegagalan sebelum respons diterima.
  if (error instanceof TypeError) return new ApiError('network', { cause: error })

  return new ApiError('network', {
    message: error instanceof Error ? error.message : undefined,
    cause: error,
  })
}
