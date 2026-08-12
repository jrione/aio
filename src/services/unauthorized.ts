/**
 * Kabel tipis dari lapisan HTTP ke lapisan sesi, untuk satu kejadian saja:
 * server menjawab `401` pada request yang membawa token.
 *
 * Sengaja sebuah modul kosong tanpa impor, dengan alasan yang sama seperti
 * `auth-token.ts`: `http.ts` tidak boleh mengimpor `src/features/auth/`.
 * Kalau ia mengimpornya, lapisan terbawah jadi bergantung pada lapisan
 * teratas — melingkar (auth memanggil http untuk login), dan setiap komponen
 * yang menyentuh data ikut menyeret seluruh mesin sesi ke dalam bundle-nya.
 *
 * Arah alirannya satu arah dan berlawanan dengan `auth-token.ts`:
 *   - `http.ts` **memberi tahu** lewat `signalUnauthorized()`
 *   - lapisan auth **mendengarkan** lewat `onUnauthorized()`
 *
 * Hanya ada satu pendengar, bukan daftar. Bukan penyederhanaan yang dipaksakan:
 * "sesi berakhir" adalah keputusan yang harus diambil sekali dan di satu tempat.
 * Kalau ada dua pihak yang boleh menanggapinya, urutan keduanya jadi penting
 * dan tidak ada yang menuliskannya.
 */

type UnauthorizedHandler = () => void

let handler: UnauthorizedHandler | undefined

/** Dipasang sekali oleh lapisan sesi saat modulnya dimuat. */
export function onUnauthorized(next: UnauthorizedHandler): void {
  handler = next
}

/**
 * Dipanggil `http.ts` saat request bertoken ditolak `401`.
 *
 * Bisa terpanggil beberapa kali beruntun bila beberapa request berbarengan
 * sama-sama ditolak, jadi pendengarnya wajib idempoten — lihat `endSession()`
 * di `src/features/auth/session.ts`.
 */
export function signalUnauthorized(): void {
  handler?.()
}
