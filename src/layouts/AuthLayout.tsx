/**
 * Kerangka halaman untuk area yang belum login (saat ini hanya `/login`).
 *
 * Seperti `AppLayout`, versi ini minimal dan disempurnakan di Issue #6.
 */
import { Outlet } from 'react-router'

import { env } from '@/config/env.ts'

export function AuthLayout() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 px-6 py-12">
      <span className="font-display text-2xl font-medium text-content">{env.appName}</span>
      <main className="w-full max-w-sm">
        <Outlet />
      </main>
    </div>
  )
}
