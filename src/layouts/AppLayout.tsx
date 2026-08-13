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
      {/*
        Tautan lompat ke konten (Issue #15).

        Sidebar berisi belasan tautan, dan tanpa ini pengguna keyboard harus
        menekan Tab melewati semuanya di **setiap** halaman hanya untuk sampai
        ke isinya. Tautannya tak terlihat sampai difokus — itulah pola yang
        benar: ia tidak mengganggu pengguna tetikus, dan muncul persis saat
        dibutuhkan.

        Harus jadi elemen fokusable pertama di halaman, jadi tempatnya di sini,
        di atas sidebar.
      */}
      <a
        href="#konten-utama"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-60 focus:rounded-lg focus:bg-brand-500 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        Lewati ke konten
      </a>

      <AppSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={closeMobile} />

      <div className={`flex min-h-svh flex-col transition-[padding] duration-200 ${contentOffset}`}>
        <AppHeader
          collapsed={collapsed}
          onOpenMobile={openMobile}
          onToggleCollapsed={toggleCollapsed}
        />

        {/*
          `tabIndex={-1}` supaya `#konten-utama` benar-benar bisa menerima fokus
          saat tautan lompat diklik. Tanpa itu, browser menggulir ke elemennya
          tapi fokus tetap tertinggal di tautan — dan Tab berikutnya kembali ke
          sidebar, membatalkan seluruh gunanya.
        */}
        <main id="konten-utama" tabIndex={-1} className="grow p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-5xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
