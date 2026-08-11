/**
 * Auth palsu — penopang sementara untuk route guard (Issue #5).
 *
 * Issue #5 hanya butuh "sudah login atau belum" agar guard bisa diuji. Login
 * sungguhan (form, token, refresh, logout terpusat) baru dibangun di Issue #10,
 * dan file ini yang diganti — bukan komponen pemakainya. Karena itu seluruh
 * akses ke status auth wajib lewat `useIsAuthenticated()` / `signIn()` /
 * `signOut()`, tidak ada yang membaca `localStorage` langsung.
 *
 * Sejak Issue #9 persistensinya memakai primitif store bersama, sama seperti
 * tema dan preferensi UI — bukan lagi kode localStorage sendiri. Efeknya bukan
 * cuma lebih sedikit baris: sinkronisasi antar tab, penanganan mode privat, dan
 * caching snapshot jadi ditulis sekali dan berlaku sama untuk semuanya.
 */
import { setAuthToken } from '@/services/auth-token.ts'
import { createPersistedStore } from '@/store/create-store.ts'
import { STORAGE_KEYS } from '@/store/storage-keys.ts'

/**
 * Token palsu yang dipasang ke header `Authorization`.
 *
 * Nilainya tidak berarti apa-apa bagi mock, tapi menyalurkannya lewat
 * `setAuthToken()` membuat jalur token di `http.ts` benar-benar terpakai sejak
 * sekarang. Kalau seam-nya baru disambung di Issue #10, kita tidak akan pernah
 * tahu apakah ia bekerja sampai hari backend sungguhan dipasang.
 */
const FAKE_TOKEN = 'fake-token-issue-10-menggantinya'

const authStore = createPersistedStore<boolean>({
  key: STORAGE_KEYS.auth,
  fallback: false,
  decode: (raw) => raw === 'true',
})

/**
 * Menjaga token sejalan dengan status login — termasuk saat status itu berubah
 * di tab lain, dan saat halaman baru dimuat.
 *
 * Status login bertahan di localStorage, sedangkan token hanya hidup di memori
 * (lihat `src/services/auth-token.ts`). Keduanya harus kembali sejalan setelah
 * refresh, jadi penyelarasannya dijalankan sekali di sini saat modul dimuat.
 * Issue #10 menggantinya dengan pemulihan sesi sungguhan lewat refresh token.
 */
const syncToken = () => {
  setAuthToken(authStore.get() ? FAKE_TOKEN : null)
}

syncToken()
authStore.subscribe(syncToken)

/** Status login saat ini. Komponen ikut render ulang saat status berubah. */
export function useIsAuthenticated(): boolean {
  return authStore.use()
}

/** Menandai pengguna sudah login. Diganti autentikasi sungguhan di Issue #10. */
export function signIn(): void {
  authStore.set(true)
}

export function signOut(): void {
  authStore.set(false)
}
