/**
 * Penerjemah dua arah antara query string dan penyaring daftar deployment.
 *
 * Ini satu-satunya tempat di aplikasi yang tahu bahwa lingkungan ditulis `env`
 * di URL sementara di seluruh kode namanya `environment`. Nama pendek itu milik
 * URL — yang dilihat, disalin, dan dikirim orang — dan tidak ada alasan
 * kependekan demi tampilan itu merembes ke nama variabel di komponen.
 *
 * Dua aturan yang sengaja tinggal di sini, bukan di komponen:
 *
 *   1. **Nilai default tidak ditulis ke URL.** `?page=1` tidak menambah
 *      informasi apa pun; yang tersalin ke chat sebaiknya hanya berisi hal yang
 *      memang sedang berlaku.
 *   2. **Mengubah penyaring mengembalikan ke halaman satu.** Kalau tidak,
 *      menyaring dari halaman 4 menghasilkan tabel kosong pada hasil yang cuma
 *      punya satu halaman — dan pengguna menyimpulkan tidak ada datanya.
 *      Aturan ini tinggal di satu fungsi karena kalau ia jadi tanggung jawab
 *      tiap `onChange`, yang terlupa tidak menimbulkan error apa pun.
 */
import { readOneOf, readPage, writeOptional, type UrlCodec } from '@/routes/useUrlState.ts'
import {
  DEPLOYMENT_STATUSES,
  type DeploymentFilter,
} from '@/services/deployments/deployment.types.ts'
import { ENVIRONMENTS } from '@/services/environment.ts'

export const deploymentFilterCodec: UrlCodec<DeploymentFilter> = {
  read: (params) => {
    const q = params.get('q')?.trim() ?? ''
    return {
      q: q === '' ? undefined : q,
      environment: readOneOf(params, 'env', ENVIRONMENTS),
      status: readOneOf(params, 'status', DEPLOYMENT_STATUSES),
      page: readPage(params),
    }
  },

  write: (filter, params) => {
    writeOptional(params, 'q', filter.q)
    writeOptional(params, 'env', filter.environment)
    writeOptional(params, 'status', filter.status)
    writeOptional(params, 'page', filter.page === 1 ? undefined : String(filter.page))
  },
}

/**
 * Menerapkan perubahan sebagian pada penyaring.
 *
 * Perpindahan halaman dikenali dari ada-tidaknya kunci `page` di dalam
 * `patch` — bukan dari nilainya. Bedanya penting: `{ page: 1 }` adalah
 * perpindahan halaman yang sah (menekan tombol "1"), dan membedakannya lewat
 * nilai akan membuat perpindahan itu diperlakukan sebagai penyaringan.
 */
export function applyFilterChange(
  current: DeploymentFilter,
  patch: Partial<DeploymentFilter>,
): DeploymentFilter {
  const next = { ...current, ...patch }
  return 'page' in patch ? next : { ...next, page: 1 }
}

/** Apakah ada penyaring yang sedang aktif — menentukan tombol "Reset" muncul. */
export const isFiltered = (filter: DeploymentFilter): boolean =>
  filter.q !== undefined || filter.environment !== undefined || filter.status !== undefined

/** Penyaring kosong, kembali ke halaman satu. */
export const EMPTY_FILTER: DeploymentFilter = { page: 1 }
