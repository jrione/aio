/**
 * Kerangka halaman untuk area yang sudah login: sidebar + header + konten.
 *
 * Layout ini hanya merangkai; isi menunya ada di `ROUTE_TABLE`, perilaku
 * bukanya di `useSidebar`, dan judul halamannya di `useCurrentRoute`.
 *
 * Sidebar dipasang `fixed`, jadi kolom konten yang menggeser dirinya sendiri
 * lewat padding kiri — bukan flexbox. Dengan begitu sidebar tidak ikut
 * bergulir bersama isi halaman, dan drawer di mobile bisa menutupi konten
 * tanpa mengubah tata letaknya.
 */
import { Outlet } from 'react-router'

import { AppHeader } from '@/layouts/AppHeader.tsx'
import { AppSidebar } from '@/layouts/AppSidebar.tsx'
import { useSidebar } from '@/layouts/useSidebar.ts'

export function AppLayout() {
  const { collapsed, mobileOpen, toggleCollapsed, openMobile, closeMobile } = useSidebar()

  // Kelas ditulis utuh agar terbaca pemindai Tailwind.
  const contentOffset = collapsed ? 'md:pl-16' : 'md:pl-64'

  return (
    <div className="min-h-svh bg-surface-sunken">
      <AppSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={closeMobile} />

      <div className={`flex min-h-svh flex-col transition-[padding] duration-200 ${contentOffset}`}>
        <AppHeader
          collapsed={collapsed}
          onOpenMobile={openMobile}
          onToggleCollapsed={toggleCollapsed}
        />

        <main className="grow p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
