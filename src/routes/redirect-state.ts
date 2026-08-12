/**
 * Alamat yang tadi hendak dibuka, dititipkan lewat `location.state` saat
 * seseorang ditolak dari halaman terproteksi.
 *
 * Tinggal di file sendiri karena dua pihak membutuhkannya — `RouteGuard` yang
 * menitipkannya lalu memakainya kembali, dan halaman login yang menampilkan ke
 * mana pengguna akan diarahkan. Keduanya komponen, jadi menaruh fungsi ini di
 * salah satunya akan memutus Fast Refresh untuk file itu.
 *
 * `location.state` datang dari riwayat browser: isinya bisa berasal dari versi
 * aplikasi yang lebih lama, dari tautan yang ditempel orang, atau dari sesi
 * yang sudah lama terbuka. Karena itu ia diperiksa, bukan dipercaya.
 */
export interface RedirectState {
  /** Path yang tadi hendak dibuka, lengkap dengan query string-nya. */
  from: string
}

export function isRedirectState(state: unknown): state is RedirectState {
  return (
    typeof state === 'object' &&
    state !== null &&
    'from' in state &&
    typeof state.from === 'string' &&
    // Hanya path di dalam aplikasi ini. Tanpa syarat ini, `from` berisi
    // "https://situs-lain.example" akan membuat halaman login kita
    // memindahkan pengguna ke sana begitu ia berhasil masuk.
    state.from.startsWith('/') &&
    !state.from.startsWith('//')
  )
}
