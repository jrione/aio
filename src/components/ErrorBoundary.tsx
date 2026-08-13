/**
 * Penangkap error render — satu-satunya komponen kelas di aplikasi ini.
 *
 * Bukan pilihan gaya: React tidak menyediakan padanan hook untuk
 * `componentDidCatch` / `getDerivedStateFromError`, dan sampai hari ini masih
 * begitu. Menuliskannya sebagai kelas adalah satu-satunya cara.
 *
 * ## Apa yang ditangkap, dan yang tidak
 *
 * Tertangkap: error yang dilempar saat **render**, di lifecycle, dan di
 * constructor komponen anak.
 *
 * **Tidak** tertangkap, dan ini yang sering disalahpahami:
 *   - error di dalam event handler (`onClick`) — di situ React tidak sedang
 *     merender, jadi tidak ada yang runtuh;
 *   - `setTimeout` dan callback asinkron lain;
 *   - promise yang gagal tanpa `catch` — termasuk request. Itu urusan
 *     `<QueryState>`, yang menerjemahkan `query.isError` jadi tampilan gagal.
 *
 * Pembagian itu memang benar begitu. Batas ini menangani "komponennya rusak",
 * sedangkan `<QueryState>` menangani "datanya gagal datang" — dua kegagalan
 * berbeda yang layak ditampilkan berbeda pula.
 *
 * ## Kenapa `resetKeys`
 *
 * Sekali sebuah batas menampilkan layar gagal, ia tetap begitu sampai
 * state-nya di-reset. Tanpa `resetKeys`, pengguna yang menekan menu lain akan
 * melihat layar gagal yang sama — URL-nya berpindah, isinya tidak — dan
 * satu-satunya jalan keluar jadi memuat ulang halaman. Route menyalurkan
 * `location.key` ke sini, jadi berpindah halaman menyembuhkannya sendiri.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'

export interface ErrorBoundaryProps {
  children: ReactNode
  /**
   * Dirender menggantikan `children` saat ada error.
   *
   * Berbentuk fungsi, bukan elemen, supaya tampilannya bisa menyebut pesan
   * errornya dan menyediakan tombol yang benar-benar mengembalikan keadaan.
   */
  fallback: (state: { error: Error; reset: () => void }) => ReactNode
  /**
   * Batas akan pulih sendiri saat salah satu nilai di sini berubah.
   * Dibandingkan dangkal, jadi isinya harus primitif.
   */
  resetKeys?: readonly unknown[]
  /** Dipanggil sekali per error tertangkap — tempat mengirim ke pelaporan. */
  onError?: (error: Error, info: ErrorInfo) => void
}

interface ErrorBoundaryState {
  error: Error | null
}

const keysChanged = (before: readonly unknown[], after: readonly unknown[]): boolean =>
  before.length !== after.length || before.some((value, index) => !Object.is(value, after[index]))

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // Bukan parameter property (`constructor(private x)`) — bentuk itu tidak bisa
  // dihapus begitu saja saat kompilasi, dan `erasableSyntaxOnly` di tsconfig
  // melarangnya supaya Node bisa menjalankan TypeScript lewat type stripping.
  override state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    // Apa pun boleh dilempar di JavaScript — termasuk string dan `undefined`.
    // Dinormalkan di sini supaya tampilan gagal tidak perlu ikut menebak.
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    this.props.onError?.(error, info)

    /*
     * Dicetak ke console di mode pengembangan.
     *
     * React sendiri sudah mencetak error yang tertangkap batas, tapi hanya
     * sebagai peringatan yang mudah tenggelam. Baris ini memastikan jejak
     * komponennya ikut terbaca — itulah yang menunjukkan komponen mana yang
     * sebenarnya melempar, dan tanpanya layar gagal yang rapi justru
     * menyembunyikan penyebabnya.
     */
    if (import.meta.env.DEV) {
      console.error('[ErrorBoundary]', error, info.componentStack)
    }
  }

  override componentDidUpdate(previous: ErrorBoundaryProps): void {
    if (this.state.error === null) return
    if (keysChanged(previous.resetKeys ?? [], this.props.resetKeys ?? [])) {
      this.reset()
    }
  }

  // Properti panah, bukan method, supaya `this`-nya tetap terikat saat
  // dioper ke tampilan gagal sebagai callback tombol.
  reset = (): void => {
    this.setState({ error: null })
  }

  override render(): ReactNode {
    const { error } = this.state
    if (error) return this.props.fallback({ error, reset: this.reset })
    return this.props.children
  }
}
