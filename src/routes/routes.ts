/**
 * Sumber tunggal (single source of truth) untuk seluruh route aplikasi.
 *
 * Satu entri di `ROUTE_TABLE` menghasilkan sekaligus:
 *   - objek route untuk React Router      → `src/routes/router.tsx`
 *   - path bertipe literal di `ROUTES`     → dipakai semua `<Link to={...}>`
 *   - keputusan guard (publik/terproteksi) → `src/routes/RouteGuard.tsx`
 *   - daftar menu navigasi                 → `src/layouts/AppLayout.tsx`
 *
 * Menambah halaman? Cukup tambah satu entri di sini. Jangan menulis string
 * path mentah (`'/settings'`) di komponen — pakai `ROUTES.settings` supaya
 * salah ketik tertangkap saat type check, bukan saat diklik pengguna.
 */
import type { ComponentType } from 'react'

/**
 * Siapa yang boleh membuka route:
 *   - `protected` → wajib login; kalau belum, dilempar ke halaman login
 *   - `guest`     → khusus yang belum login; kalau sudah, dilempar ke dashboard
 *   - `any`       → tanpa penjagaan (mis. halaman 404)
 */
export type RouteAccess = 'protected' | 'guest' | 'any'

/** Kerangka halaman yang membungkus route. Komponennya dipetakan di router.tsx. */
export type RouteLayout = 'app' | 'auth' | 'bare'

export interface RouteDefinition {
  /** Kunci stabil untuk mengambil path lewat `ROUTES`. */
  readonly id: string
  readonly path: string
  readonly access: RouteAccess
  readonly layout: RouteLayout
  /** Judul halaman. Dipakai di menu navigasi dan `document.title`. */
  readonly title: string
  /** Tampilkan di menu navigasi utama. */
  readonly nav: boolean
  /**
   * Import dinamis halaman. Bentuk `() => import(...)` inilah yang membuat
   * Vite memecah tiap halaman jadi chunk terpisah (lazy loading).
   */
  readonly load: () => Promise<{ default: ComponentType }>
}

export const ROUTE_TABLE = [
  {
    id: 'dashboard',
    path: '/',
    access: 'protected',
    layout: 'app',
    title: 'Dashboard',
    nav: true,
    load: () => import('@/pages/DashboardPage.tsx'),
  },
  {
    id: 'settings',
    path: '/settings',
    access: 'protected',
    layout: 'app',
    title: 'Settings',
    nav: true,
    load: () => import('@/pages/SettingsPage.tsx'),
  },
  {
    id: 'login',
    path: '/login',
    access: 'guest',
    layout: 'auth',
    title: 'Masuk',
    nav: false,
    load: () => import('@/pages/LoginPage.tsx'),
  },
  {
    id: 'notFound',
    path: '*',
    access: 'any',
    layout: 'bare',
    title: 'Halaman tidak ditemukan',
    nav: false,
    load: () => import('@/pages/NotFoundPage.tsx'),
  },
] as const satisfies readonly RouteDefinition[]

type Route = (typeof ROUTE_TABLE)[number]

export type RouteId = Route['id']

/**
 * Peta `{ id: path }` dengan tipe literal — `ROUTES.settings` bertipe
 * `'/settings'`, bukan `string`. Dipakai di seluruh `<Link>` dan `<Navigate>`.
 */
export const ROUTES = Object.fromEntries(ROUTE_TABLE.map((route) => [route.id, route.path])) as {
  readonly [R in Route as R['id']]: R['path']
}

/** Route yang muncul di menu navigasi utama, urutannya sesuai ROUTE_TABLE. */
export const NAV_ROUTES = ROUTE_TABLE.filter((route) => route.nav)

/** Tujuan setelah login berhasil, dan tempat guest dilempar dari route terproteksi. */
export const HOME_ROUTE = ROUTES.dashboard
export const LOGIN_ROUTE = ROUTES.login
