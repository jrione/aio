/**
 * Hook untuk mengubah akun sendiri: nama dan password.
 *
 * Tinggal di lapisan fitur, bukan di `src/services/profile/`, karena keduanya
 * menyentuh sesi — dan service tidak boleh mengimpor apa pun dari `src/features/`.
 * Polanya sama persis dengan `use-login.ts`: mutation biasa, ditambah satu hal
 * yang tidak diurus TanStack Query.
 */
import { useMutation } from '@tanstack/react-query'

import { updateSessionUser } from '@/features/auth/session.ts'
import { profileService } from '@/services/profile/profile.service.ts'

/**
 * Mengganti nama, lalu menyalurkan hasilnya ke sesi.
 *
 * Penyaluran itu di sini, sekali, bukan di komponen. Nama pengguna muncul di
 * header dan menu pengguna, dan keduanya membaca `sessionStore` — kalau langkah
 * ini diserahkan ke pemanggil, form kedua yang kelak juga mengubah profil harus
 * mengingatnya sendiri, dan yang lupa tidak menimbulkan error apa pun: cuma nama
 * lama yang bertahan sampai halaman dimuat ulang.
 */
export function useUpdateProfile() {
  return useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: updateSessionUser,
  })
}

/**
 * Mengganti password.
 *
 * Sesi **tidak** diakhiri setelah berhasil, dan itu keputusan. Server sungguhan
 * biasanya mencabut sesi di perangkat lain sambil mempertahankan yang sekarang;
 * meniru "cabut semua termasuk yang ini" akan melempar pengguna ke halaman login
 * tepat setelah ia melakukan hal yang benar.
 */
export function useChangePassword() {
  return useMutation({ mutationFn: profileService.changePassword })
}
