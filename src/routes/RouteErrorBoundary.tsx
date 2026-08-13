/**
 * Batas error setingkat halaman.
 *
 * Dipasang **di dalam** layout, bukan di luarnya. Itu satu-satunya bagian yang
 * benar-benar menentukan apakah acceptance criteria Issue #14 terpenuhi:
 * "error runtime di satu halaman tidak membuat seluruh aplikasi blank". Kalau
 * batasnya membungkus layout, halaman yang runtuh membawa serta sidebar, header,
 * dan menu pengguna — dan yang tersisa memang layar kosong dengan satu pesan.
 * Di dalam layout, yang runtuh cuma isi `<Outlet>`; pengguna tetap bisa membaca
 * menu dan berpindah keluar dari halaman yang rusak.
 *
 * `location.key` dipakai sebagai kunci reset. Tanpanya, batas yang sudah
 * terlanjur menampilkan layar gagal akan tetap begitu meski pengguna menekan
 * menu lain: URL-nya berpindah, isinya tidak. Kunci ini berubah setiap kali
 * navigasi terjadi — termasuk saat pengguna kembali ke halaman yang sama — jadi
 * berpindah halaman menyembuhkannya sendiri.
 */
import type { ReactNode } from 'react'
import { useLocation } from 'react-router'

import { RouteCrash } from '@/components/CrashFallback.tsx'
import { ErrorBoundary } from '@/components/ErrorBoundary.tsx'

export function RouteErrorBoundary({ children }: { children: ReactNode }) {
  const { key } = useLocation()

  return (
    <ErrorBoundary resetKeys={[key]} fallback={RouteCrash}>
      {children}
    </ErrorBoundary>
  )
}
