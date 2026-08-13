/**
 * Service domain profil.
 *
 * Perhatikan yang **tidak** ada di sini: `getProfile()`. Identitas pengguna
 * sudah datang bersama sesi (`/auth/refresh`), dan menambahkan endpoint kedua
 * yang menjawab pertanyaan sama berarti dua sumber kebenaran tentang "siapa
 * yang sedang masuk" — yang cepat atau lambat akan berbeda isinya, biasanya
 * tepat setelah salah satunya diperbarui.
 *
 * Karena itu `updateProfile` mengembalikan `User` yang sudah diperbarui, dan
 * pemanggilnya menyalurkannya kembali ke lapisan sesi. Satu sumber, satu jalur.
 */
import type { User } from '@/services/auth/auth.types.ts'
import { http } from '@/services/http.ts'
import type {
  NotificationSettings,
  PasswordChange,
  ProfileUpdate,
} from '@/services/profile/profile.types.ts'

export const profileService = {
  updateProfile: (input: ProfileUpdate): Promise<User> =>
    http.patch<User>('/profile', { body: input }),

  /**
   * Balasannya sengaja kosong (`204`).
   *
   * Endpoint ganti password tidak punya alasan mengembalikan apa pun, dan
   * endpoint yang mengembalikan data pengguna di sini hanya menambah satu
   * tempat lagi yang bisa kebocoran.
   */
  changePassword: (input: PasswordChange): Promise<void> =>
    http.put<void>('/profile/password', { body: input }),

  getNotifications: (signal?: AbortSignal): Promise<NotificationSettings> =>
    http.get<NotificationSettings>('/profile/notifications', { signal }),

  updateNotifications: (input: NotificationSettings): Promise<NotificationSettings> =>
    http.put<NotificationSettings>('/profile/notifications', { body: input }),
}
