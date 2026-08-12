/**
 * Tempat menyimpan token yang dipasang HTTP client ke header `Authorization`.
 *
 * Sengaja berdiri sendiri, terpisah dari `src/features/auth/`, demi memutus
 * ketergantungan melingkar: service auth nanti (Issue #10) memanggil `http`
 * untuk login, sedangkan `http` butuh token dari auth. Kalau keduanya saling
 * mengimpor, modulnya saling menunggu. Modul kecil ini jadi titik temu yang
 * tidak mengimpor siapa pun.
 *
 * Arah alirannya satu arah: lapisan auth **menulis** lewat `setAuthToken()`,
 * lapisan HTTP **membaca** lewat `getAuthToken()`. Tidak ada yang lain yang
 * boleh menyentuh file ini.
 *
 * Token disimpan di memori saja — hilang saat tab ditutup, dan itu memang yang
 * diinginkan. Menaruh token di localStorage membuatnya terbaca skrip mana pun
 * yang berhasil masuk ke halaman. Issue #10 yang memutuskan cara memulihkan
 * sesi setelah refresh (umumnya lewat cookie refresh-token httpOnly).
 */

let token: string | null = null

/** Dipanggil lapisan auth setelah login berhasil, dan `null` saat logout. */
export function setAuthToken(value: string | null): void {
  token = value
}

/** Dibaca `http.ts` di setiap request. `null` berarti request dikirim anonim. */
export function getAuthToken(): string | null {
  return token
}
