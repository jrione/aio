/**
 * Kontrak data modul Deployments (Issue #12).
 *
 * Sama seperti domain dashboard, file inilah kesepakatan antara backend,
 * service, mock, dan UI. Bedanya, domain ini punya **mutasi** — deployment bisa
 * dijalankan dan dibatalkan — jadi ada dua bentuk tambahan yang tidak dimiliki
 * domain yang hanya membaca: masukan untuk membuat, dan bentuk detail yang
 * lebih lengkap daripada baris tabelnya.
 */
import type { DeploymentEnvironment, EnvironmentFilter } from '@/services/environment.ts'
import type { PageParams } from '@/services/paginated.ts'

/**
 * Perjalanan sebuah deployment.
 *
 * Lima nilai, bukan tiga seperti `ActivityStatus` di dashboard, dan itu
 * disengaja: dashboard meringkas banyak jenis kejadian sehingga hanya butuh
 * "berhasil / gagal / berjalan", sedangkan halaman yang khusus mengurus
 * deployment perlu membedakan yang masih mengantre dari yang sudah berjalan,
 * dan yang dibatalkan orang dari yang gagal sendiri. Membedakan keduanya adalah
 * bagian dari gunanya halaman ini.
 */
export type DeploymentStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'canceled'

export const DEPLOYMENT_STATUSES = [
  'queued',
  'running',
  'succeeded',
  'failed',
  'canceled',
] as const satisfies readonly DeploymentStatus[]

/** Satu baris di tabel daftar. Ringkas — cukup untuk ditampilkan dan diurutkan. */
export interface Deployment {
  readonly id: string
  /** Nama layanan yang dirilis, mis. `api-gateway`. */
  readonly service: string
  readonly environment: DeploymentEnvironment
  /** Tag rilis, mis. `v2.14.3`. */
  readonly version: string
  /** SHA commit yang dipendekkan. */
  readonly commit: string
  readonly branch: string
  readonly status: DeploymentStatus
  readonly triggeredBy: string
  /** ISO 8601. */
  readonly startedAt: string
  /**
   * Lama proses dalam milidetik, atau `null` bila belum selesai.
   *
   * `null` dipilih ketimbang `0` karena keduanya berarti hal yang sangat
   * berbeda, dan `0` adalah nilai yang sah untuk deployment yang gagal seketika.
   */
  readonly durationMs: number | null
}

export type LogLevel = 'info' | 'warn' | 'error'

export interface DeploymentLogLine {
  /** ISO 8601. */
  readonly at: string
  readonly level: LogLevel
  readonly message: string
}

/**
 * Bentuk lengkap untuk halaman detail.
 *
 * Log dan riwayat menempel di sini, bukan di endpoint terpisah, karena halaman
 * detail selalu membutuhkan ketiganya sekaligus — memisahkannya berarti tiga
 * request untuk satu layar, tiga keadaan memuat, dan tiga cara gagal.
 */
export interface DeploymentDetail extends Deployment {
  readonly log: readonly DeploymentLogLine[]
  /** Deployment sebelumnya untuk layanan & lingkungan yang sama, terbaru dulu. */
  readonly history: readonly Deployment[]
}

/**
 * Penyaring daftar deployment.
 *
 * Seluruh isinya opsional, dan itu bukan kemalasan: tiap field yang kosong
 * berarti "jangan saring dimensi ini". Bentuk itu memetakan langsung ke query
 * string — parameter yang tidak ada berarti tidak menyaring — sehingga
 * penerjemahan URL ↔ penyaring di `deployment-filter.ts` tidak perlu mengenal
 * nilai sentinel apa pun.
 */
export interface DeploymentFilter extends EnvironmentFilter, PageParams {
  /** Pencarian bebas atas nama layanan, versi, commit, atau pemicunya. */
  q?: string
  status?: DeploymentStatus
}

/** Masukan untuk menjalankan deployment baru. */
export interface NewDeployment {
  readonly service: string
  readonly environment: DeploymentEnvironment
  readonly version: string
}
