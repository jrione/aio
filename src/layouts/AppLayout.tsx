/**
 * Kerangka halaman untuk area yang sudah login.
 *
 * Versi ini sengaja minimal — cukup untuk membuktikan navigasi client-side
 * berjalan tanpa reload. Sidebar responsif, header lengkap, dan breadcrumb
 * dibangun di Issue #6, menggantikan isi file ini.
 *
 * Menu diambil dari `NAV_ROUTES`, jadi menambah halaman baru di `ROUTE_TABLE`
 * dengan `nav: true` otomatis memunculkan menunya di sini.
 */
import { NavLink, Outlet, useNavigate } from 'react-router'

import { env } from '@/config/env.ts'
import { signOut } from '@/features/auth/fake-auth.ts'
import { LOGIN_ROUTE, NAV_ROUTES } from '@/routes/routes.ts'

export function AppLayout() {
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    void navigate(LOGIN_ROUTE, { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-b border-edge bg-surface-raised">
        <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
          <span className="font-display font-medium text-content">{env.appName}</span>

          <nav aria-label="Navigasi utama" className="flex gap-1">
            {NAV_ROUTES.map((route) => (
              <NavLink
                key={route.id}
                to={route.path}
                end={route.path === '/'}
                className={({ isActive }) =>
                  `rounded-lg px-3 py-1.5 text-sm transition-colors ${
                    isActive
                      ? 'bg-brand-500 text-white'
                      : 'text-content-muted hover:bg-surface-sunken hover:text-content'
                  }`
                }
              >
                {route.title}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            onClick={handleSignOut}
            className="ml-auto rounded-lg border border-edge px-3 py-1.5 text-sm text-content-muted transition-colors hover:border-danger hover:text-danger"
          >
            Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl grow px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
