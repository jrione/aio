/**
 * Kerangka polos untuk halaman yang belum login (saat ini hanya `/login`).
 *
 * Tanpa sidebar dan tanpa header: pengunjung yang belum masuk tidak punya
 * urusan dengan menu area terproteksi. Yang tersisa hanya identitas aplikasi
 * dan satu kartu di tengah layar.
 */
import { Outlet } from 'react-router'

import { env } from '@/config/env.ts'

export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-surface-sunken px-4 py-12 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-500 font-display font-semibold text-white">
          {env.appName.slice(0, 2).toUpperCase()}
        </span>
        <span className="font-display text-xl font-medium text-content">{env.appName}</span>
      </div>

      <main className="w-full max-w-sm">
        <Outlet />
      </main>
    </div>
  )
}
