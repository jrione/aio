/**
 * Kerangka tanpa navigasi, untuk halaman yang berdiri sendiri seperti 404.
 *
 * Halaman 404 tidak memakai `AppLayout` karena URL yang tidak dikenal bisa
 * dibuka siapa saja — termasuk pengunjung yang belum login, yang tidak
 * seharusnya melihat menu area terproteksi.
 */
import { Outlet } from 'react-router'

export function BareLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center px-6 py-12">
      <main className="w-full max-w-lg">
        <Outlet />
      </main>
    </div>
  )
}
