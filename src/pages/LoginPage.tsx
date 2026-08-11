/**
 * Halaman login (route `/login`), hanya untuk yang belum login.
 *
 * Belum ada form, validasi, maupun panggilan API — semuanya bagian Issue #10.
 * Tombol di sini hanya membalik flag auth palsu supaya route guard bisa diuji
 * dari ujung ke ujung.
 *
 * Setelah berhasil, pengguna dikembalikan ke halaman yang tadi hendak dibuka
 * (dibawa lewat `location.state.from` oleh `RouteGuard`), bukan selalu ke
 * dashboard.
 */
import { useLocation, useNavigate } from 'react-router'

import { signIn } from '@/features/auth/fake-auth.ts'
import type { RedirectState } from '@/routes/RouteGuard.tsx'
import { HOME_ROUTE } from '@/routes/routes.ts'

const isRedirectState = (state: unknown): state is RedirectState =>
  typeof state === 'object' && state !== null && 'from' in state && typeof state.from === 'string'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()

  const destination = isRedirectState(location.state) ? location.state.from : HOME_ROUTE

  const handleSignIn = () => {
    signIn()
    void navigate(destination, { replace: true })
  }

  return (
    <div className="rounded-xl border border-edge bg-surface-raised p-6 text-center">
      <h1 className="font-display text-xl font-medium text-content">Masuk</h1>
      <p className="mt-2 text-sm text-content-muted">
        Autentikasi sungguhan dibangun di Issue #10. Tombol di bawah memakai flag auth palsu.
      </p>

      <button
        type="button"
        onClick={handleSignIn}
        className="mt-6 w-full rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-600"
      >
        Masuk sebagai pengguna contoh
      </button>

      {destination !== HOME_ROUTE && (
        <p className="mt-4 text-xs text-content-muted">
          Setelah masuk kamu diarahkan ke <code className="font-mono">{destination}</code>
        </p>
      )}
    </div>
  )
}
