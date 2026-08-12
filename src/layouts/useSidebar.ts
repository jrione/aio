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

const STORAGE_KEY = 'aio.sidebar-collapsed'

const readCollapsed = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export interface SidebarState {
  collapsed: boolean
  mobileOpen: boolean
  toggleCollapsed: () => void
  openMobile: () => void
  closeMobile: () => void
}

export function useSidebar(): SidebarState {
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, String(collapsed))
    } catch {
      // Mode privat melarang localStorage; pilihannya cukup berlaku sesi ini.
    }
  }, [collapsed])

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
    setCollapsed((current) => !current)
  }, [])
  const openMobile = useCallback(() => {
    setMobileOpen(true)
  }, [])
  const closeMobile = useCallback(() => {
    setMobileOpen(false)
  }, [])

  return { collapsed, mobileOpen, toggleCollapsed, openMobile, closeMobile }
}
