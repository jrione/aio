/**
 * Akar aplikasi: provider global, lalu router.
 *
 * Provider ditaruh di luar `<RouterProvider>` supaya state-nya bertahan
 * melintasi perpindahan halaman — toast yang dipicu sebelum navigasi tetap
 * terlihat setelah halaman berganti. Provider berikutnya (state global,
 * query client) menyusul di Issue #9 dan menumpuk di sini.
 */
import { RouterProvider } from 'react-router'

import { ToastProvider } from '@/components/ui/ToastProvider.tsx'
import { router } from '@/routes/router.tsx'

export default function App() {
  return (
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  )
}
