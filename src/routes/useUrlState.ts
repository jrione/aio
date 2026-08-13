/**
 * State yang tinggal di query string, bukan di `useState`.
 *
 * ## Kenapa URL, bukan state komponen
 *
 * Acceptance criteria Issue #12 memintanya begini: "filter & pagination
 * tercermin di URL query string (bisa di-share/bookmark)". Tapi alasannya lebih
 * jauh dari sekadar bisa disalin ke chat. Penyaring yang hanya hidup di memori
 * komponen akan hilang saat halaman dimuat ulang, tidak bisa dibuka di tab baru,
 * tidak bisa dikirim ke rekan yang sedang menyelidiki hal yang sama, dan tombol
 * Kembali di browser akan melompati seluruh pekerjaan penyaringan sekaligus.
 * URL memperbaiki keempatnya dengan satu keputusan.
 *
 * Konsekuensinya harus diterima juga: query string adalah **masukan dari luar**.
 * Siapa pun bisa mengetik `?page=-3&status=meledak`, jadi pembacaannya wajib
 * memvalidasi, bukan memercayai — lihat `read` pada tiap codec.
 *
 * ## Bentuknya: satu codec per halaman, bukan satu hook per parameter
 *
 * Godaannya adalah menyediakan `useQueryParam('page', …)` lalu memanggilnya
 * sekali per parameter. Itu tampak lebih rapi sampai muncul aturan yang
 * melibatkan dua parameter sekaligus — dan aturan itu pasti muncul: mengganti
 * penyaring harus mengembalikan tabel ke halaman satu. Dengan hook per
 * parameter, aturan itu tidak punya tempat tinggal dan berakhir disalin ke tiap
 * `onChange`, tempat ia bisa terlupa satu per satu.
 *
 * Karena itu satu halaman punya satu codec: seluruh parameternya dibaca dan
 * ditulis sekaligus, dan aturan antar-parameter jadi fungsi biasa di sebelahnya.
 */
import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

export interface UrlCodec<Value> {
  /**
   * Menerjemahkan query string jadi nilai yang bisa dipakai.
   *
   * Wajib mengembalikan nilai yang sah untuk masukan apa pun — termasuk yang
   * kosong dan yang diketik asal-asalan.
   */
  read: (params: URLSearchParams) => Value
  /**
   * Menuliskan nilai ke `params`, yang sudah berisi salinan query string saat
   * ini.
   *
   * Menerima objek yang bisa diubah, bukan mengembalikan yang baru, supaya
   * parameter milik pihak lain di URL yang sama tetap utuh: codec hanya
   * menyentuh kunci miliknya sendiri, dan yang tidak disentuh ikut terbawa.
   */
  write: (value: Value, params: URLSearchParams) => void
}

export interface UrlStateOptions {
  /**
   * Mengganti entri riwayat alih-alih menambah yang baru.
   *
   * Dipakai untuk perubahan yang datang bertubi-tubi — mengetik di kotak
   * pencarian. Tanpa ini, satu kata yang diketik meninggalkan tujuh entri
   * riwayat, dan tombol Kembali berubah jadi tombol "hapus satu huruf".
   * Untuk pilihan yang tegas (ganti lingkungan, pindah halaman) default-nya
   * yang benar: menambah entri, sehingga Kembali membatalkan pilihan itu.
   */
  replace?: boolean
}

export function useUrlState<Value>(
  codec: UrlCodec<Value>,
): [Value, (next: Value, options?: UrlStateOptions) => void] {
  const [searchParams, setSearchParams] = useSearchParams()

  const value = codec.read(searchParams)

  const set = useCallback(
    (next: Value, { replace = false }: UrlStateOptions = {}) => {
      /*
       * Bentuk fungsi dipakai, bukan `new URLSearchParams(searchParams)` dari
       * closure. Dua perubahan yang terjadi di render yang sama — mis. hasil
       * pencarian yang mengecil sekaligus mengembalikan halaman ke satu — akan
       * sama-sama membaca salinan lama kalau sumbernya closure, dan yang kedua
       * menimpa yang pertama.
       */
      setSearchParams(
        (current) => {
          const params = new URLSearchParams(current)
          codec.write(next, params)
          return params
        },
        { replace },
      )
    },
    [codec, setSearchParams],
  )

  return [value, set]
}

/* ─────────────────────────────────────────────────────────────
 * Pembaca yang dipakai berulang oleh codec halaman
 * ───────────────────────────────────────────────────────────── */

/**
 * Membaca satu nilai dari daftar yang diizinkan.
 *
 * Nilai yang tidak dikenal jatuh ke `undefined`, bukan melempar: query string
 * rusak berarti penyaringnya diabaikan, bukan halamannya gagal dimuat. Ini juga
 * yang membuat tautan lama tetap terbuka setelah sebuah pilihan dihapus dari
 * aplikasi.
 */
export const readOneOf = <Value extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly Value[],
): Value | undefined => {
  const raw = params.get(key)
  return allowed.find((candidate) => candidate === raw)
}

/** Membaca nomor halaman; apa pun yang bukan bilangan bulat positif jadi `1`. */
export const readPage = (params: URLSearchParams, key = 'page'): number => {
  const parsed = Number(params.get(key))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

/**
 * Menulis parameter, atau menghapusnya bila nilainya kosong.
 *
 * Menghapus lebih baik daripada menulis nilai kosong: `?q=&status=` adalah URL
 * yang panjang dan tidak berarti apa-apa, dan URL yang bisa dibagikan sebaiknya
 * hanya memuat hal yang memang sedang berlaku.
 */
export const writeOptional = (
  params: URLSearchParams,
  key: string,
  value: string | undefined,
): void => {
  if (value === undefined || value === '') params.delete(key)
  else params.set(key, value)
}
