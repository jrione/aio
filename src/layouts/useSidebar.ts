/**
 * State sidebar: satu untuk desktop, satu untuk mobile.
 *
 * Keduanya sengaja dipisah karena artinya memang berbeda:
 *   - `collapsed`  → di desktop sidebar menyusut jadi rel ikon. Disimpan di
 *                    localStorage supaya pilihan pengguna bertahan.
 *   - `mobileOpen` → di layar sempit sidebar jadi drawer di atas konten.
 *                    Selalu mulai tertutup; tidak masuk akal disimpan.
 *
 * Yang menentukan mana yang berlaku adalah CSS breakpoint, bukan JavaScript —
 * tidak ada `useMediaQuery` di sini. Akibatnya tidak ada kedipan saat render
 * pertama, dan mengubah ukuran jendela tidak perlu memicu render ulang.
 */
import { useCallback, useEffect, useState } from 'react'
import { useLocation } from 'react-router'

import { sidebarCollapsedStore } from '@/store/ui.ts'

export interface SidebarState {
  collapsed: boolean
  mobileOpen: boolean
  toggleCollapsed: () => void
  openMobile: () => void
  closeMobile: () => void
}

export function useSidebar(): SidebarState {
  // `collapsed` adalah preferensi yang bertahan, jadi ia tinggal di store
  // global. `mobileOpen` keadaan sesaat, jadi cukup state lokal — pembagian
  // itulah aturan yang dijelaskan di `src/store/create-store.ts`.
  const collapsed = sidebarCollapsedStore.use()
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  // Berpindah halaman menutup drawer — kalau tidak, menu menutupi halaman
  // yang baru saja dibuka pengguna.
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Escape adalah jalan keluar yang diharapkan dari elemen menutupi layar.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  const toggleCollapsed = useCallback(() => {
    sidebarCollapsedStore.set(!sidebarCollapsedStore.get())
  }, [])
  const openMobile = useCallback(() => {
    setMobileOpen(true)
  }, [])
  const closeMobile = useCallback(() => {
    setMobileOpen(false)
  }, [])

  return { collapsed, mobileOpen, toggleCollapsed, openMobile, closeMobile }
}
