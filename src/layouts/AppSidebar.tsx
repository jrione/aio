/**
 * Sidebar navigasi utama.
 *
 * Isinya seluruhnya dibaca dari `NAV_MENU` di `src/routes/routes.ts` —
 * tidak ada satu pun item menu yang ditulis langsung di JSX ini. Menambah
 * menu berarti menambah entri di tabel route, bukan menyunting file ini.
 *
 * Perilaku responsif diserahkan ke CSS, bukan JavaScript:
 *   - < md : sidebar berada di luar layar dan digeser masuk sebagai drawer
 *            saat `mobileOpen`, dengan backdrop di belakangnya.
 *   - ≥ md : sidebar selalu tampak, lebarnya menyusut jadi rel ikon saat
 *            `collapsed`. Label disembunyikan lewat `md:hidden`, bukan
 *            dilepas dari DOM, supaya di mobile labelnya tetap muncul.
 */
import { NavLink } from 'react-router'

import { Icon } from '@/components/Icon.tsx'
import { env } from '@/config/env.ts'
import { NAV_MENU } from '@/routes/routes.ts'

interface AppSidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onClose: () => void
}

export function AppSidebar({ collapsed, mobileOpen, onClose }: AppSidebarProps) {
  // Kelas ditulis utuh, bukan dirakit lewat template string, karena Tailwind
  // memindai source sebagai teks.
  const width = collapsed ? 'md:w-16' : 'md:w-64'
  const labelVisibility = collapsed ? 'md:hidden' : ''

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Tutup menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}

      <aside
        id="sidebar-utama"
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-edge bg-surface transition-transform duration-200 md:translate-x-0 ${width} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-2 border-b border-edge px-4">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-500 font-display text-sm font-semibold text-white">
            {env.appName.slice(0, 2).toUpperCase()}
          </span>
          <span
            className={`truncate font-display font-medium text-content ${labelVisibility}`}
            title={env.appName}
          >
            {env.appName}
          </span>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup menu"
            className="ml-auto rounded-lg p-1.5 text-content-muted hover:bg-surface-sunken hover:text-content md:hidden"
          >
            <Icon name="close-icon" />
          </button>
        </div>

        <nav aria-label="Navigasi utama" className="flex grow flex-col gap-6 overflow-y-auto p-3">
          {NAV_MENU.map(({ group, routes }) => (
            <div key={group.id}>
              <h2
                className={`px-3 pb-2 text-xs font-semibold tracking-wider text-content-muted uppercase ${labelVisibility}`}
              >
                {group.label}
              </h2>

              <ul className="flex flex-col gap-1">
                {routes.map((route) => (
                  <li key={route.id}>
                    <NavLink
                      to={route.path}
                      end={route.path === '/'}
                      title={route.title}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                          isActive
                            ? 'bg-brand-500 text-white'
                            : 'text-content-muted hover:bg-surface-sunken hover:text-content'
                        }`
                      }
                    >
                      <Icon name={route.nav.icon} className="size-5 shrink-0" />
                      <span className={`truncate ${labelVisibility}`}>{route.title}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
