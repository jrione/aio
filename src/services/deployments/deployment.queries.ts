/**
 * Hook data untuk domain deployments — inilah yang dipakai komponen.
 *
 * Domain pertama di aplikasi ini yang punya mutasi, jadi ada satu keputusan
 * yang belum pernah perlu diambil sebelumnya: **siapa yang menyegarkan cache
 * setelah data berubah.**
 *
 * Jawabannya di sini, bukan di komponen. Sebuah deployment baru mengubah tabel
 * daftar, jumlah halamannya, dan riwayat di halaman detail sekaligus; kalau
 * penyegaran itu ditulis di tempat tombolnya diklik, maka tombol kedua yang
 * melakukan hal sama di halaman lain harus mengingat daftar yang sama persis —
 * dan yang terlupa tidak menimbulkan error, cuma angka basi yang terlihat
 * seperti angka benar.
 *
 * Yang **tidak** diurus di sini: toast dan perpindahan halaman. Keduanya
 * keputusan tampilan yang berbeda di tiap tempat pemanggilan, jadi komponen
 * yang menuliskannya lewat `onSuccess` miliknya sendiri.
 */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { deploymentService } from '@/services/deployments/deployment.service.ts'
import type { DeploymentFilter } from '@/services/deployments/deployment.types.ts'

/**
 * Pabrik query key, berjenjang seperti di domain dashboard.
 *
 * `all` sebagai akar membuat satu `invalidateQueries({ queryKey: keys.all })`
 * cukup untuk menyegarkan daftar, detail, dan setiap variasi penyaringnya
 * sekaligus — tanpa perlu mendaftar ulang kombinasi yang sedang hidup di cache.
 */
export const deploymentKeys = {
  all: ['deployments'] as const,
  list: (filter: DeploymentFilter) => [...deploymentKeys.all, 'list', filter] as const,
  detail: (id: string) => [...deploymentKeys.all, 'detail', id] as const,
  services: () => [...deploymentKeys.all, 'services'] as const,
}

export function useDeployments(filter: DeploymentFilter) {
  return useQuery({
    queryKey: deploymentKeys.list(filter),
    queryFn: ({ signal }) => deploymentService.list(filter, signal),
    // Menahan halaman sebelumnya selama halaman baru diambil: tanpa ini tabel
    // runtuh jadi skeleton setiap kali pengguna menekan "berikutnya", dan
    // tombol yang baru saja diklik berpindah dari bawah kursor.
    placeholderData: keepPreviousData,
  })
}

export function useDeployment(id: string) {
  return useQuery({
    queryKey: deploymentKeys.detail(id),
    queryFn: ({ signal }) => deploymentService.get(id, signal),
  })
}

/**
 * Daftar layanan yang bisa dirilis.
 *
 * Nyaris tidak pernah berubah, jadi dianggap segar jauh lebih lama daripada
 * default 30 detik — membuka dialog "Deployment baru" berkali-kali tidak perlu
 * menanyakan hal yang sama ke server berkali-kali.
 */
const SERVICES_STALE_TIME_MS = 5 * 60 * 1000

export function useDeploymentServices() {
  return useQuery({
    queryKey: deploymentKeys.services(),
    queryFn: ({ signal }) => deploymentService.listServices(signal),
    staleTime: SERVICES_STALE_TIME_MS,
  })
}

export function useCreateDeployment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deploymentService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deploymentKeys.all }),
  })
}

export function useCancelDeployment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deploymentService.cancel,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deploymentKeys.all }),
  })
}

export function useDeleteDeployment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deploymentService.remove,
    /*
     * Cache detail dibuang, bukan sekadar ditandai basi.
     *
     * `invalidateQueries` menyuruh mengambil ulang — dan mengambil ulang
     * sesuatu yang baru saja dihapus berarti satu request yang pasti dijawab
     * `404`, lengkap dengan tampilan error yang berkedip sesaat sebelum
     * pengguna dipindahkan. `removeQueries` membuang entri itu diam-diam,
     * yang memang yang diinginkan untuk data yang sudah tidak ada.
     */
    onSuccess: async (_result, id: string) => {
      queryClient.removeQueries({ queryKey: deploymentKeys.detail(id) })
      await queryClient.invalidateQueries({ queryKey: deploymentKeys.all })
    },
  })
}
