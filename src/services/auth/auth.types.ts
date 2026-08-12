/**
 * Kontrak data autentikasi antara frontend dan backend.
 *
 * Dipakai bersama oleh service, mock, dan lapisan sesi di `src/features/auth/`.
 * Satu file tipe untuk ketiganya berarti mock yang menyimpang dari kontrak
 * gagal saat `npm run typecheck`, bukan saat backend sungguhan dipasang.
 */

/**
 * Peran pengguna. Yang menentukan *apa yang boleh dilakukan* bukan peran ini
 * langsung, melainkan peta peran → izin di `src/features/auth/permissions.ts`
 * — lihat catatan di sana soal kenapa komponen tidak boleh membandingkan peran.
 */
export type Role = 'admin' | 'operator' | 'viewer'

export interface User {
  readonly id: string
  readonly name: string
  readonly email: string
  readonly role: Role
}

export interface Credentials {
  email: string
  password: string
}

/**
 * Balasan `/auth/login` dan `/auth/refresh`.
 *
 * `expiresIn` dalam detik, mengikuti kebiasaan OAuth2 — server yang menentukan
 * umur token, bukan klien. Frontend memakainya untuk menjadwalkan perpanjangan
 * sebelum token mati, jadi memperpendek umur token di server tidak menuntut
 * satu baris pun diubah di sini.
 *
 * Refresh token **tidak** ada di balasan ini dengan sengaja: ia dikirim server
 * sebagai cookie `HttpOnly`, sehingga JavaScript halaman tidak pernah bisa
 * membacanya. Lihat `auth.service.ts`.
 */
export interface SessionResponse {
  readonly token: string
  readonly expiresIn: number
  readonly user: User
}
