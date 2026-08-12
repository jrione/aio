/**
 * Akar aplikasi: provider global, lalu router.
 *
 * Provider ditaruh di luar `<RouterProvider>` supaya state-nya bertahan
 * melintasi perpindahan halaman — toast yang dipicu sebelum navigasi tetap
 * terlihat setelah halaman berganti, dan cache query tidak dibuang hanya
 * karena pengguna pindah menu lalu kembali.
 *
 * Urutannya disengaja: `QueryClientProvider` di luar `ToastProvider` supaya
 * penanganan error global nanti (Issue #14) bisa memunculkan toast dari dalam
 * lapisan query.
 */
import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'

import { ToastProvider } from '@/components/ui/ToastProvider.tsx'
import { bootstrapSession } from '@/features/auth/session.ts'
import { router } from '@/routes/router.tsx'
import { queryClient } from '@/services/query-client.ts'

export default function App() {
  /*
   * Memulihkan sesi sebelum apa pun sempat mengambil data.
   *
   * Aman meski efek ini berjalan setelah render pertama: selama sesi belum
   * diketahui, `RouteGuard` menahan seluruh halaman terproteksi, jadi tidak ada
   * request yang sempat berangkat tanpa token lalu ditolak `401`.
   */
  useEffect(() => {
    bootstrapSession()
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}
