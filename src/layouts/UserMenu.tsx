/**
 * Menu pengguna di pojok kanan header.
 *
 * Identitas penggunanya masih tetap (`Pengguna contoh`) — data profil
 * sungguhan baru ada setelah Issue #10. Yang sudah nyata di sini cuma aksi
 * keluar, yang memanggil `signOut()` dari lapisan auth, bukan menyentuh
 * localStorage sendiri.
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import { Icon } from '@/components/Icon.tsx'
import { signOut } from '@/features/auth/fake-auth.ts'
import { LOGIN_ROUTE } from '@/routes/routes.ts'

export function UserMenu() {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

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

  const handleSignOut = () => {
    setOpen(false)
    signOut()
    void navigate(LOGIN_ROUTE, { replace: true })
  }

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
        <span className="hidden sm:inline">Pengguna contoh</span>
        <Icon name="chevron-down-icon" className="size-4 shrink-0 text-content-muted" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-48 overflow-hidden rounded-lg border border-edge bg-surface-raised shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
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
