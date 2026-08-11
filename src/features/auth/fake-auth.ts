/**
 * Auth palsu — penopang sementara untuk route guard (Issue #5).
 *
 * Issue #5 hanya butuh "sudah login atau belum" agar guard bisa diuji. Login
 * sungguhan (form, token, refresh, logout terpusat) baru dibangun di Issue #10,
 * dan file ini yang diganti — bukan komponen pemakainya. Karena itu seluruh
 * akses ke status auth wajib lewat `useIsAuthenticated()` / `signIn()` /
 * `signOut()`, tidak ada yang membaca `localStorage` langsung.
 *
 * Statusnya disimpan di localStorage supaya bertahan saat halaman di-refresh —
 * tanpa itu, menguji "akses route terproteksi tanpa auth" jadi merepotkan.
 */
import { useSyncExternalStore } from 'react'

import { setAuthToken } from '@/services/auth-token.ts'

const STORAGE_KEY = 'aio.fake-auth'

/**
 * Token palsu yang dipasang ke header `Authorization`.
 *
 * Nilainya tidak berarti apa-apa bagi mock, tapi menyalurkannya lewat
 * `setAuthToken()` membuat jalur token di `http.ts` benar-benar terpakai sejak
 * sekarang. Kalau seam-nya baru disambung di Issue #10, kita tidak akan pernah
 * tahu apakah ia bekerja sampai hari backend sungguhan dipasang.
 */
const FAKE_TOKEN = 'fake-token-issue-10-menggantinya'

type Listener = () => void

const listeners = new Set<Listener>()

const emit = () => {
  for (const listener of listeners) listener()
}

const subscribe = (listener: Listener) => {
  listeners.add(listener)
  // Perubahan dari tab lain juga ikut disiarkan agar status auth tidak
  // berbeda antar tab.
  window.addEventListener('storage', listener)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', listener)
  }
}

const readSnapshot = (): boolean => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    // Mode privat pada sebagian browser melarang localStorage. Anggap belum
    // login daripada membuat aplikasi gagal render.
    return false
  }
}

const write = (value: boolean) => {
  try {
    if (value) window.localStorage.setItem(STORAGE_KEY, 'true')
    else window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Diabaikan dengan sengaja: status tetap berlaku selama sesi ini lewat emit().
  }
  setAuthToken(value ? FAKE_TOKEN : null)
  emit()
}

// Status login bertahan di localStorage, sedangkan token hanya hidup di memori.
// Setelah refresh halaman keduanya harus kembali sejalan, jadi token dipasang
// ulang saat modul dimuat. Issue #10 menggantinya dengan pemulihan sesi
// sungguhan lewat refresh token.
setAuthToken(readSnapshot() ? FAKE_TOKEN : null)

/** Status login saat ini. Komponen ikut render ulang saat status berubah. */
export function useIsAuthenticated(): boolean {
  return useSyncExternalStore(subscribe, readSnapshot, () => false)
}

/** Menandai pengguna sudah login. Diganti autentikasi sungguhan di Issue #10. */
export function signIn(): void {
  write(true)
}

export function signOut(): void {
  write(false)
}
