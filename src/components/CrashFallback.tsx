/**
 * Tampilan saat sebuah komponen gagal dirender.
 *
 * Dua bentuk, karena dua keadaan yang sangat berbeda:
 *
 *   - `RouteCrash` — satu halaman yang runtuh. Kerangka aplikasi masih utuh,
 *     jadi tampilannya tinggal di dalam layout: sidebar, header, dan menu tetap
 *     ada, dan pengguna bisa berpindah halaman untuk keluar dari keadaan ini.
 *   - `AppCrash` — akar aplikasi yang runtuh. Tidak ada yang bisa dipercaya
 *     masih hidup, termasuk router, jadi tidak ada tautan navigasi sama sekali
 *     dan satu-satunya jalan keluar adalah memuat ulang.
 *
 * ## Kegagalan memuat chunk diperlakukan berbeda
 *
 * Setelah aplikasi di-deploy ulang, nama berkas chunk berubah. Tab yang sudah
 * lama terbuka masih memegang nama lama, dan `import()` untuk halaman yang belum
 * pernah dibuka akan gagal — bukan karena kodenya salah, melainkan karena
 * berkasnya memang sudah tidak ada.
 *
 * Menawarkan "coba lagi" di situ keliru: percobaan keberapa pun akan gagal sama
 * persis, dan pengguna menyimpulkan aplikasinya rusak. Yang benar adalah memuat
 * ulang halaman, karena itulah yang mengambil daftar chunk yang baru.
 */
import { Link } from 'react-router'

import { buttonVariants } from '@/components/ui/button-variants.ts'
import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { HOME_ROUTE } from '@/routes/routes.ts'

/**
 * Mengenali kegagalan memuat modul dinamis.
 *
 * Pesannya berbeda-beda antar browser — Chrome, Firefox, dan Safari
 * masing-masing punya kalimatnya sendiri — jadi yang dicocokkan adalah
 * ketiganya, bukan satu.
 */
const CHUNK_ERROR =
  /failed to fetch dynamically imported module|error loading dynamically imported module|importing a module script failed|chunkloaderror/i

const isChunkLoadError = (error: Error): boolean =>
  CHUNK_ERROR.test(`${error.name} ${error.message}`)

const reload = () => {
  window.location.reload()
}

/**
 * Pesan yang ditampilkan ke pengguna.
 *
 * Isi `error.message` sengaja **tidak** ditampilkan apa adanya di sini —
 * berbeda dari `<QueryState>`, tempat pesannya memang datang dari `ApiError`
 * dan sudah ditulis untuk dibaca manusia. Error render datang dari mana saja:
 * "Cannot read properties of undefined (reading 'map')" tidak memberi tahu
 * pengguna apa pun kecuali bahwa ada yang rusak, dan menampilkannya cuma
 * memindahkan rasa bingung.
 *
 * Di mode pengembangan pesannya tetap dimunculkan, karena di sana pembacanya
 * memang orang yang bisa memperbaikinya.
 */
const detail = (error: Error): string | undefined =>
  import.meta.env.DEV ? `${error.name}: ${error.message}` : undefined

export function RouteCrash({ error, reset }: { error: Error; reset: () => void }) {
  if (isChunkLoadError(error)) {
    return (
      <ErrorState
        title="Aplikasi sudah diperbarui"
        description="Bagian halaman ini tidak bisa dimuat karena versinya sudah berganti. Muat ulang untuk mengambil versi terbaru."
        onRetry={reload}
        retryLabel="Muat ulang halaman"
      />
    )
  }

  return (
    <ErrorState
      title="Halaman ini bermasalah"
      description={
        detail(error) ??
        'Terjadi kesalahan tak terduga saat menampilkan halaman ini. Bagian aplikasi lain masih bisa dipakai.'
      }
      onRetry={reset}
      retryLabel="Coba tampilkan lagi"
      action={
        <Link to={HOME_ROUTE} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          Kembali ke dashboard
        </Link>
      }
    />
  )
}

export function AppCrash({ error }: { error: Error }) {
  return (
    /*
     * Sengaja tidak memakai layout, `<Link>`, atau apa pun dari router.
     *
     * Batas ini berada di atas `<RouterProvider>`; kalau yang runtuh justru
     * router-nya, komponen yang bergantung padanya akan ikut melempar di dalam
     * tampilan gagal ini — dan hasilnya layar putih, persis yang sedang
     * dihindari. `<a>` biasa dan `window.location` tidak punya masalah itu.
     */
    <div className="grid min-h-dvh place-items-center bg-surface p-6">
      <div className="w-full max-w-md">
        <ErrorState
          title={isChunkLoadError(error) ? 'Aplikasi sudah diperbarui' : 'Aplikasi gagal dimuat'}
          description={
            isChunkLoadError(error)
              ? 'Versi yang sedang terbuka sudah tidak berlaku. Muat ulang untuk mengambil yang terbaru.'
              : (detail(error) ??
                'Terjadi kesalahan tak terduga. Muat ulang halaman; bila terus berulang, hubungi tim platform.')
          }
          onRetry={reload}
          retryLabel="Muat ulang halaman"
          action={
            <a href="/" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              Ke halaman awal
            </a>
          }
        />
      </div>
    </div>
  )
}
