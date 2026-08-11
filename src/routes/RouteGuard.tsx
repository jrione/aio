/**
 * Penjaga akses route. Satu komponen menangani ketiga nilai `access` di
 * `ROUTE_TABLE`, jadi aturannya tidak tersebar ke tiap halaman.
 *
 *   protected → belum login  ⇒ dilempar ke halaman login
 *   guest     → sudah login  ⇒ dilempar ke dashboard
 *   any       → dibiarkan lewat
 *
 * Redirect memakai `replace` supaya tombol Back tidak memantulkan pengguna
 * kembali ke halaman yang baru saja ditolak.
 */
import { Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'

import { useIsAuthenticated } from '@/features/auth/fake-auth.ts'
import { HOME_ROUTE, LOGIN_ROUTE, type RouteAccess } from '@/routes/routes.ts'

/** Bentuk `location.state` yang dibawa saat guest ditolak dari route terproteksi. */
export interface RedirectState {
  /** Path yang tadi hendak dibuka, untuk dikembalikan setelah login berhasil. */
  from: string
}

interface RouteGuardProps {
  access: RouteAccess
  children: ReactNode
}

export function RouteGuard({ access, children }: RouteGuardProps) {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()

  if (access === 'protected' && !isAuthenticated) {
    const state: RedirectState = { from: `${location.pathname}${location.search}` }
    return <Navigate to={LOGIN_ROUTE} replace state={state} />
  }

  if (access === 'guest' && isAuthenticated) {
    return <Navigate to={HOME_ROUTE} replace />
  }

  return children
}
