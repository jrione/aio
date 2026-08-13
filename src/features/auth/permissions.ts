/**
 * Hak akses berbasis peran.
 *
 * ## Kenapa izin, bukan peran, yang diperiksa
 *
 * Godaan terbesarnya adalah menulis `user.role === 'admin'` di tempat yang
 * membutuhkannya. Itu bekerja sampai peran keempat muncul — lalu setiap
 * perbandingan seperti itu harus dicari satu per satu di seluruh kode, dan yang
 * terlewat tidak menimbulkan error apa pun: tombolnya cuma hilang, atau justru
 * muncul untuk orang yang tidak berhak.
 *
 * Karena itu komponen menanyakan **apa yang boleh dilakukan**, bukan **siapa
 * penggunanya**. Menambah peran berarti menambah satu baris di `ROLE_PERMISSIONS`
 * di bawah, dan tidak ada satu pun komponen yang perlu disentuh.
 *
 * ## Ini penjaga tampilan, bukan penjaga data
 *
 * Semua yang di file ini berjalan di browser dan bisa dimatikan siapa pun yang
 * membuka devtools. Gunanya menyembunyikan hal yang bukan urusan pengguna,
 * bukan mengamankannya. Server tetap wajib menolak sendiri setiap request yang
 * tidak berhak — pemeriksaan di sini hanya membuat penolakan itu jarang perlu
 * terjadi.
 */
import { useCurrentUser } from '@/features/auth/session.ts'
import type { Role, User } from '@/services/auth/auth.types.ts'

/**
 * Satu izin = satu kemampuan yang bisa dimiliki atau tidak.
 *
 * Dinamai `<objek>:<aksi>` supaya daftarnya tetap terbaca setelah tumbuh, dan
 * supaya jelas bahwa "melihat" dan "mengubah" adalah dua izin berbeda.
 */
export type Permission =
  'dashboard:read' | 'deployment:read' | 'deployment:run' | 'settings:manage' | 'user:manage'

/**
 * Membaca dan menjalankan sengaja dipisah jadi dua izin.
 *
 * Seorang `viewer` boleh membuka daftar deployment dan membaca log-nya — itu
 * justru inti pekerjaannya saat sedang menyelidiki gangguan — tapi tidak boleh
 * merilis, membatalkan, atau menghapus apa pun. Kalau keduanya digabung jadi
 * satu izin, satu-satunya cara memberi akses baca adalah memberi akses tulis.
 */
const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin: ['dashboard:read', 'deployment:read', 'deployment:run', 'settings:manage', 'user:manage'],
  operator: ['dashboard:read', 'deployment:read', 'deployment:run'],
  viewer: ['dashboard:read', 'deployment:read'],
}

/**
 * Versi murni yang bisa dipanggil di luar komponen — mis. dari route guard yang
 * sudah memegang penggunanya.
 *
 * `permission: null` berarti "tidak butuh izin apa pun" dan selalu lolos. Ia
 * ditulis eksplisit di tabel route, bukan lewat properti opsional, supaya
 * keputusan "halaman ini terbuka" terlihat saat membaca tabelnya.
 */
export function can(user: User | null, permission: Permission | null): boolean {
  if (permission === null) return true
  if (!user) return false
  return ROLE_PERMISSIONS[user.role].includes(permission)
}

/**
 * Pemeriksa izin untuk pengguna yang sedang masuk.
 *
 * Mengembalikan fungsi, bukan boolean, supaya satu komponen bisa memeriksa
 * beberapa izin sekaligus tanpa memanggil hook di dalam perulangan — hal yang
 * dilarang aturan hook React, dan yang paling sering dilanggar justru saat
 * menyaring daftar menu.
 */
export function useCan(): (permission: Permission | null) => boolean {
  const user = useCurrentUser()
  return (permission) => can(user, permission)
}
