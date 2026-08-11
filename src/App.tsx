/**
 * Akar aplikasi. Sejak Issue #5 tugasnya tinggal satu: memasang router.
 *
 * Seluruh isi halaman pindah ke `src/pages/`, dan kerangkanya ke
 * `src/layouts/`. Provider global (state, tema, query client) menyusul di
 * Issue #9 dan dipasang membungkus `<RouterProvider>` di sini.
 */
import { RouterProvider } from 'react-router'

import { router } from '@/routes/router.tsx'

export default function App() {
  return <RouterProvider router={router} />
}
