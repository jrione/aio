/**
 * Preferensi tema pengguna.
 *
 * Tiga keadaan, bukan dua. `system` bukan sekadar nilai awal yang malas: ia
 * berarti "ikuti pengaturan sistem saya, sekarang dan seterusnya". Pengguna
 * yang sistemnya berpindah gelap otomatis saat malam mengharapkan aplikasi ikut
 * berpindah — dan itu tidak mungkin diwakili oleh boolean.
 *
 * Cara kerjanya di CSS (lihat `src/index.css`):
 *   - `system` → atribut `data-theme` **dihapus**, media query
 *     `prefers-color-scheme` yang berlaku. Tidak ada JavaScript yang ikut
 *     campur, jadi perubahan pengaturan sistem langsung terasa.
 *   - `light` / `dark` → `data-theme` dipasang, selector `[data-theme]`
 *     mengalahkan media query.
 */
import { useSyncExternalStore } from 'react'

import { createPersistedStore } from '@/store/create-store.ts'
import { STORAGE_KEYS, THEME_ATTRIBUTE } from '@/store/storage-keys.ts'

/** Yang dipilih pengguna. */
export type ThemePreference = 'system' | 'light' | 'dark'

/** Yang benar-benar tampil setelah `system` diterjemahkan. */
export type ResolvedTheme = 'light' | 'dark'

const PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark']

export const themeStore = createPersistedStore<ThemePreference>({
  key: STORAGE_KEYS.theme,
  fallback: 'system',
  // Nilai asing (versi lama, suntingan manual) jatuh ke `system` lewat
  // `fallback`, bukan membuat aplikasi gagal render.
  decode: (raw) => PREFERENCES.find((preference) => preference === raw),
})

const DARK_QUERY = '(prefers-color-scheme: dark)'

const systemPrefersDark = (): boolean => window.matchMedia(DARK_QUERY).matches

/**
 * Menuliskan preferensi ke `<html>`.
 *
 * Dipanggil di module scope (lihat bagian bawah file) supaya atributnya sudah
 * benar sebelum React merender apa pun. Skrip bootstrap di `index.html` sudah
 * melakukan hal yang sama lebih awal lagi — ini yang menjaganya tetap benar
 * setelah pengguna mengubah pilihan.
 */
const applyToDocument = (preference: ThemePreference): void => {
  const { documentElement } = document
  if (preference === 'system') documentElement.removeAttribute(THEME_ATTRIBUTE)
  else documentElement.setAttribute(THEME_ATTRIBUTE, preference)
}

export function setTheme(preference: ThemePreference): void {
  themeStore.set(preference)
}

/** Preferensi yang dipilih pengguna — inilah yang ditandai aktif di UI. */
export function useThemePreference(): ThemePreference {
  return themeStore.use()
}

/**
 * Tema yang benar-benar tampil.
 *
 * Ikut berubah dua arah: saat pengguna memilih, dan saat pengaturan sistem
 * berubah sementara pilihannya `system`. Yang kedua itu yang membuat hook ini
 * tidak bisa sekadar diturunkan dari `useThemePreference()`.
 */
export function useResolvedTheme(): ResolvedTheme {
  const preference = useThemePreference()

  const systemIsDark = useSyncExternalStore(
    (listener) => {
      const media = window.matchMedia(DARK_QUERY)
      media.addEventListener('change', listener)
      return () => {
        media.removeEventListener('change', listener)
      }
    },
    () => systemPrefersDark(),
    () => false,
  )

  if (preference !== 'system') return preference
  return systemIsDark ? 'dark' : 'light'
}

// Efek samping saat modul dimuat, sengaja di luar React: atribut tema harus
// sudah benar sebelum komponen pertama dirender, dan harus tetap benar meski
// yang mengubahnya bukan komponen (mis. tab lain lewat event `storage`).
applyToDocument(themeStore.get())
themeStore.subscribe(() => {
  applyToDocument(themeStore.get())
})
