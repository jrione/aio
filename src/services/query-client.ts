/**
 * Konfigurasi TanStack Query untuk seluruh aplikasi.
 *
 * Kebijakan cache dan retry ditulis sekali di sini, bukan diulang di setiap
 * `useQuery`. Hook per domain hanya menyebut query key dan fungsi pengambilnya;
 * kalau ada yang perlu menyimpang, penyimpangan itu ditulis eksplisit di
 * hook-nya dan langsung terlihat sebagai pengecualian.
 */
import { QueryClient } from '@tanstack/react-query'

import { ApiError } from '@/services/api-error.ts'

/**
 * Memberi tahu TanStack Query bahwa seluruh error di aplikasi ini bertipe
 * `ApiError`.
 *
 * Bisa dijanjikan karena `http.ts` menormalkan apa pun yang tertangkap lewat
 * `toApiError()` sebelum melemparkannya. Hasilnya `query.error` sudah bertipe
 * benar di semua komponen tanpa satu pun generic ditulis manual — dan
 * `error.message` dijamin ada serta berbahasa Indonesia.
 */
declare module '@tanstack/react-query' {
  interface Register {
    defaultError: ApiError
  }
}

/** Berapa lama data dianggap masih segar sebelum diambil ulang di latar. */
const STALE_TIME_MS = 30_000

/** Maksimal percobaan ulang untuk kegagalan yang memang layak diulang. */
const MAX_RETRIES = 2

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME_MS,

      /**
       * Mengulang request yang 4xx hanya membuang waktu pengguna: permintaan
       * yang sama akan ditolak dengan alasan yang sama. `ApiError.retryable`
       * yang memutuskan, jadi aturannya hanya ada di satu tempat.
       */
      retry: (failureCount, error) => {
        if (!(error instanceof ApiError)) return false
        return error.retryable && failureCount < MAX_RETRIES
      },

      /**
       * Dashboard operasional biasanya dibiarkan terbuka di monitor sambil
       * pengguna berpindah jendela. Mengambil ulang setiap kali tab difokuskan
       * membuat angka ikut berubah tanpa diminta; `staleTime` di atas sudah
       * menangani kesegaran data.
       */
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Mutasi mengubah data di server. Mengulanginya otomatis berisiko
      // menjalankan aksi yang sama dua kali — biarkan pengguna yang memutuskan.
      retry: false,
    },
  },
})
