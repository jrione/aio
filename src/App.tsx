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
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'

import { ToastProvider } from '@/components/ui/ToastProvider.tsx'
import { router } from '@/routes/router.tsx'
import { queryClient } from '@/services/query-client.ts'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  )
}
