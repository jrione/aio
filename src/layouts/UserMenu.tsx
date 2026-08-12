/**
 * Menu pengguna di pojok kanan header.
 *
 * Identitasnya datang dari sesi (`useCurrentUser`), bukan dari teks tetap —
 * termasuk perannya, supaya orang yang menu-nya terlihat lebih sedikit bisa
 * langsung melihat sebabnya alih-alih mengira ada yang rusak.
 *
 * Menekan "Keluar" tidak menavigasi ke mana pun secara langsung, dan itu
 * disengaja: `signOut()` mengubah state sesi, `RouteGuard` yang membaca state
 * itu memutuskan halaman terproteksi tidak boleh lagi ditampilkan. Satu aturan,
 * satu tempat — dan yang sama juga berlaku saat sesi berakhir dari sebab lain
 * (kedaluwarsa, keluar dari tab sebelah) yang tidak melewati tombol ini.
 */
import { useEffect, useRef, useState } from 'react'

import { Icon } from '@/components/Icon.tsx'
import { ThemeSwitcher } from '@/components/ThemeSwitcher.tsx'
import { signOut, useCurrentUser } from '@/features/auth/session.ts'
import type { Role } from '@/services/auth/auth.types.ts'

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Administrator',
  operator: 'Operator',
  viewer: 'Pengamat',
}

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const user = useCurrentUser()

  // Klik di luar dan Escape sama-sama menutup menu — dua jalan keluar yang
  // diharapkan pengguna dari sebuah dropdown.
  useEffect(() => {
    if (!open) return undefined

    const onPointerDown = (event: PointerEvent) => {
      const { target } = event
      if (target instanceof Node && !containerRef.current?.contains(target)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((current) => !current)
        }}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg border border-edge px-2 py-1.5 text-sm text-content transition-colors hover:bg-surface-sunken"
      >
        <Icon name="user-icon" className="size-5 shrink-0 text-content-muted" />
        <span className="hidden max-w-40 truncate sm:inline">{user?.name ?? 'Tamu'}</span>
        <Icon name="chevron-down-icon" className="size-4 shrink-0 text-content-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-lg border border-edge bg-surface-raised shadow-lg"
        >
          {user && (
            <div className="border-b border-edge px-3 py-2.5">
              <p className="truncate text-sm font-medium text-content">{user.name}</p>
              <p className="truncate text-xs text-content-muted">{user.email}</p>
              <p className="mt-1.5 inline-flex rounded-full bg-info-soft px-2 py-0.5 text-xs text-info-strong">
                {ROLE_LABEL[user.role]}
              </p>
            </div>
          )}

          {/* Di luar `role="menuitem"` dengan sengaja: pemilih tema adalah
              grup radio, bukan perintah sekali-tekan. Membungkusnya jadi
              menuitem akan membohongi screen reader soal apa yang terjadi
              saat ditekan. */}
          <div className="border-b border-edge p-2">
            <p className="px-1 pb-1.5 text-xs text-content-muted">Tema</p>
            <ThemeSwitcher />
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-content transition-colors hover:bg-surface-sunken hover:text-danger"
          >
            <Icon name="logout-icon" className="size-5 shrink-0" />
            Keluar
          </button>
        </div>
      )}
    </div>
  )
}
