/**
 * Header atas: tombol menu, judul halaman, menu pengguna.
 *
 * Judulnya tidak dikirim sebagai prop dari tiap halaman — diambil dari entri
 * route yang sedang aktif, sumber yang sama dengan label sidebar dan
 * `document.title`. Halaman baru otomatis punya judul yang benar.
 */
import { Icon } from '@/components/Icon.tsx'
import { UserMenu } from '@/layouts/UserMenu.tsx'
import { useCurrentRoute } from '@/routes/useCurrentRoute.ts'

interface AppHeaderProps {
  collapsed: boolean
  onOpenMobile: () => void
  onToggleCollapsed: () => void
}

export function AppHeader({ collapsed, onOpenMobile, onToggleCollapsed }: AppHeaderProps) {
  const route = useCurrentRoute()

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-edge bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMobile}
        aria-label="Buka menu"
        aria-controls="sidebar-utama"
        className="rounded-lg p-2 text-content-muted transition-colors hover:bg-surface-sunken hover:text-content md:hidden"
      >
        <Icon name="menu-icon" />
      </button>

      <button
        type="button"
        onClick={onToggleCollapsed}
        aria-label={collapsed ? 'Lebarkan sidebar' : 'Ciutkan sidebar'}
        aria-controls="sidebar-utama"
        aria-expanded={!collapsed}
        className="hidden rounded-lg p-2 text-content-muted transition-colors hover:bg-surface-sunken hover:text-content md:inline-flex"
      >
        <Icon name="sidebar-icon" />
      </button>

      <h1 className="truncate font-display text-lg font-medium text-content">{route.title}</h1>

      <div className="ml-auto">
        <UserMenu />
      </div>
    </header>
  )
}
