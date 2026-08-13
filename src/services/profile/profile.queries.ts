/**
 * Hook data untuk preferensi notifikasi.
 *
 * Mutasi profil dan password **tidak** ada di sini melainkan di
 * `src/features/auth/use-profile.ts`, karena keduanya menyentuh lapisan sesi —
 * dan lapisan service tidak boleh tahu-menahu soal `src/features/`. Arah impor
 * itu dijaga `npm run check:layers`; alasannya ditulis di aturannya.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { profileService } from '@/services/profile/profile.service.ts'
import type { NotificationSettings } from '@/services/profile/profile.types.ts'

export const profileKeys = {
  all: ['profile'] as const,
  notifications: () => [...profileKeys.all, 'notifications'] as const,
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: profileKeys.notifications(),
    queryFn: ({ signal }) => profileService.getNotifications(signal),
  })
}

export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: profileService.updateNotifications,
    /*
     * Hasil dari server yang dipasang ke cache, bukan nilai yang dikirim.
     *
     * Keduanya biasanya sama — sampai server menormalkan sesuatu (membulatkan
     * jam, menolak kombinasi tertentu). Memasang nilai yang dikirim berarti UI
     * menampilkan apa yang diminta pengguna, bukan apa yang benar-benar
     * tersimpan, dan selisihnya baru ketahuan setelah halaman dimuat ulang.
     */
    onSuccess: (settings: NotificationSettings) => {
      queryClient.setQueryData(profileKeys.notifications(), settings)
    },
  })
}
