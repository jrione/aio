/**
 * Service domain auth — satu-satunya lapisan yang tahu path endpoint sesi.
 *
 * ## Kenapa ada `refresh`, dan kenapa token tidak disimpan di localStorage
 *
 * Access token hidup di memori saja (`src/services/auth-token.ts`), jadi ia
 * lenyap setiap kali halaman dimuat ulang. Itu disengaja: apa pun yang ditaruh
 * di `localStorage` bisa dibaca skrip mana pun yang berhasil masuk ke halaman —
 * satu dependency yang tersusupi sudah cukup untuk membawa pergi sesi seluruh
 * pengguna, dan token yang dicuri tetap sah sampai kedaluwarsa.
 *
 * Yang membuat sesi tetap bertahan setelah refresh adalah **refresh token
 * berbentuk cookie `HttpOnly`** yang dipasang server saat login. JavaScript
 * halaman tidak bisa membacanya sama sekali, tapi browser tetap mengirimkannya
 * otomatis ke endpoint refresh. Karena itu `refresh()` di bawah tidak menerima
 * argumen apa pun: kredensialnya memang tidak pernah lewat kode ini.
 *
 * `credentials: 'include'` wajib ada pada endpoint yang bergantung pada cookie
 * itu. Tanpanya browser diam-diam tidak mengirim cookie begitu API berada di
 * origin berbeda dari aplikasi — gejalanya "selalu terlempar ke login di
 * produksi, padahal di lokal aman", karena di lokal keduanya satu origin.
 */
import type { Credentials, SessionResponse } from '@/services/auth/auth.types.ts'
import { http } from '@/services/http.ts'

export const authService = {
  /**
   * Menukar email + password dengan access token.
   *
   * `anonymous: true` bukan sekadar "belum punya token": ia juga menyatakan
   * bahwa `401` di sini berarti kredensial salah, bukan sesi berakhir — lihat
   * `RequestOptions.anonymous` di `http.ts`.
   */
  login: (credentials: Credentials, signal?: AbortSignal) =>
    http.post<SessionResponse>('/auth/login', {
      body: credentials,
      anonymous: true,
      credentials: 'include',
      signal,
    }),

  /**
   * Menerbitkan access token baru berbekal cookie refresh.
   *
   * Dipakai di dua saat: sekali ketika aplikasi dimuat (memulihkan sesi setelah
   * refresh halaman), dan berulang sebelum token yang sedang dipakai mati.
   * Gagal di sini berarti sesinya memang sudah habis.
   */
  refresh: (signal?: AbortSignal) =>
    http.post<SessionResponse>('/auth/refresh', {
      anonymous: true,
      credentials: 'include',
      signal,
    }),

  /**
   * Meminta server mencabut sesi dan menghapus cookie refresh.
   *
   * Tanpa langkah ini, "keluar" hanya membuang token dari memori satu tab —
   * cookie-nya masih di browser, dan membuka ulang aplikasi memulihkan sesi
   * yang tadi sudah ditutup pengguna.
   *
   * `anonymous: true` di sini bukan kelalaian. Yang menandai sesi mana yang
   * dicabut adalah cookie refresh, bukan access token — dan itu justru yang
   * dibutuhkan: permintaan keluar harus tetap berhasil ketika access token-nya
   * sudah mati, karena di situlah pengguna paling ingin sesinya benar-benar
   * ditutup. Sekalian ia menutup satu jebakan: `401` dari endpoint ini tidak
   * ikut dibaca sebagai "sesi berakhir" yang memicu proses keluar sekali lagi.
   */
  logout: (signal?: AbortSignal) =>
    http.post<void>('/auth/logout', { anonymous: true, credentials: 'include', signal }),
}
