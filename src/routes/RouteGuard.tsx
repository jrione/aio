/**
 * Penjaga akses route. Satu komponen menangani seluruh nilai `access` dan
 * `permission` di `ROUTE_TABLE`, jadi aturannya tidak tersebar ke tiap halaman.
 *
 *   status `unknown` → tahan dulu; sesi masih ditanyakan ke server
 *   protected        → belum masuk   ⇒ dilempar ke halaman login
 *   guest            → sudah masuk   ⇒ dilempar ke dashboard
 *   any              → dibiarkan lewat
 *   permission       → tidak berhak  ⇒ ditolak di tempat, tanpa pindah URL
 *
 * Redirect memakai `replace` supaya tombol Back tidak memantulkan pengguna
 * kembali ke halaman yang baru saja ditolak. Yang membuat tombol Back benar-
 * benar aman setelah keluar bukan `replace` itu, melainkan kenyataan bahwa
 * penjaga ini membaca state sesi saat render: halaman terproteksi yang dibuka
 * lagi dari riwayat tetap dinilai ulang, dan tetap ditolak.
 */
import { Navigate, useLocation } from 'react-router'
import type { ReactNode } from 'react'

import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { can, type Permission } from '@/features/auth/permissions.ts'
import { useSession } from '@/features/auth/session.ts'
import { isRedirectState, type RedirectState } from '@/routes/redirect-state.ts'
import { RouteFallback } from '@/routes/RouteFallback.tsx'
import { HOME_ROUTE, LOGIN_ROUTE, type RouteAccess } from '@/routes/routes.ts'

interface RouteGuardProps {
  access: RouteAccess
  permission: Permission | null
  children: ReactNode
}

export function RouteGuard({ access, permission, children }: RouteGuardProps) {
  const { status, user } = useSession()
  const location = useLocation()

  /*
   * Sesi belum diketahui: aplikasi baru dimuat dan sedang menanyakan apakah
   * ada sesi yang bisa dipulihkan. Memutuskan sekarang berarti menebak, dan
   * tebakannya selalu salah untuk salah satu pihak — pengguna yang masih masuk
   * akan terlempar ke halaman login sepersekian detik sebelum ditarik kembali.
   *
   * Route `any` (mis. 404) tidak perlu menunggu apa pun.
   */
  if (status === 'unknown' && access !== 'any') return <RouteFallback />

  if (access === 'protected' && status !== 'authenticated') {
    const state: RedirectState = { from: `${location.pathname}${location.search}` }
    return <Navigate to={LOGIN_ROUTE} replace state={state} />
  }

  /*
   * Pengembalian ke halaman asal terjadi di sini, bukan di halaman login.
   *
   * Halaman login memang bisa saja menavigasi sendiri setelah berhasil, tapi
   * aturan ini toh tetap harus ada — sesi bisa dimulai tanpa melewati form,
   * mis. dari tab sebelah atau dari pemulihan sesi saat halaman dimuat. Dua
   * tempat yang sama-sama boleh memindahkan pengguna berarti dua redirect yang
   * berlomba, dan yang menang berganti-ganti tergantung urutan render.
   */
  if (access === 'guest' && status === 'authenticated') {
    const to = isRedirectState(location.state) ? location.state.from : HOME_ROUTE
    return <Navigate to={to} replace />
  }

  /*
   * Tidak berhak ≠ tidak ada. Menolak di tempat, bukan mengalihkan ke dashboard,
   * karena URL-nya memang benar dan pengguna berhak tahu bahwa halaman itu ada
   * tapi bukan untuknya. Mengalihkan diam-diam membuat orang mengira tautannya
   * rusak, lalu mencoba lagi.
   */
  if (!can(user, permission)) {
    return (
      <EmptyState
        icon="lock-icon"
        title="Halaman ini di luar hak akses Anda"
        description="Peran akun Anda tidak mencakup halaman ini. Hubungi administrator bila memang membutuhkannya."
      />
    )
  }

  return children
}
