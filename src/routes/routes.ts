/**
 * Sumber tunggal (single source of truth) untuk seluruh route aplikasi,
 * sekaligus file konfigurasi menu navigasi.
 *
 * Satu entri di `ROUTE_TABLE` menghasilkan sekaligus:
 *   - objek route untuk React Router      → `src/routes/router.tsx`
 *   - path bertipe literal di `ROUTES`     → dipakai semua `<Link to={...}>`
 *   - keputusan guard (publik/terproteksi) → `src/routes/RouteGuard.tsx`
 *   - item menu sidebar beserta ikonnya    → `src/layouts/AppSidebar.tsx`
 *   - judul di header & tab browser        → `src/layouts/AppHeader.tsx`
 *
 * Menambah halaman atau menu? Cukup tambah satu entri di sini. Jangan menulis
 * string path mentah (`'/settings'`) di komponen — pakai `ROUTES.settings`
 * supaya salah ketik tertangkap saat type check, bukan saat diklik pengguna.
 *
 * Konfigurasi menu sengaja tinggal di file yang sama dengan definisi route,
 * bukan di file terpisah. Begitu dipisah, keduanya bisa menyimpang: menu
 * menunjuk path yang sudah dihapus, atau halaman baru lupa didaftarkan di
 * menu. Di sini keduanya mustahil berbeda karena memang satu baris yang sama.
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

export interface NavGroup {
  readonly id: string
  /** Judul kecil di atas sekelompok menu. */
  readonly label: string
}

/**
 * Pengelompokan menu di sidebar, urutannya sesuai urutan di sini.
 * Modul domain (Pipelines, Deployments, Servers) menyusul di Issue #12 dan
 * tinggal menumpang di grup `operasional`.
 */
export const NAV_GROUPS = [
  { id: 'operasional', label: 'Operasional' },
  { id: 'sistem', label: 'Sistem' },
] as const satisfies readonly NavGroup[]

export type NavGroupId = (typeof NAV_GROUPS)[number]['id']

/** Penempatan sebuah route di sidebar. `false` berarti tidak muncul di menu. */
export interface NavPlacement {
  /** Id simbol di `public/icons.svg`. */
  readonly icon: string
  readonly group: NavGroupId
}

export interface RouteDefinition {
  /** Kunci stabil untuk mengambil path lewat `ROUTES`. */
  readonly id: string
  readonly path: string
  readonly access: RouteAccess
  readonly layout: RouteLayout
  /** Judul halaman. Dipakai di menu sidebar, header, dan `document.title`. */
  readonly title: string
  /** Penempatan di sidebar, atau `false` bila halaman ini tidak bermenu. */
  readonly nav: NavPlacement | false
  /**
   * `true` = hanya terdaftar saat `npm run dev`. Di build produksi route-nya
   * tidak dipasang sama sekali, jadi URL-nya jatuh ke halaman 404. Ditulis
   * eksplisit di tiap entri, bukan opsional, supaya keputusannya selalu
   * terlihat saat membaca tabel.
   */
  readonly devOnly: boolean
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
    nav: { icon: 'dashboard-icon', group: 'operasional' },
    devOnly: false,
    load: () => import('@/pages/DashboardPage.tsx'),
  },
  {
    id: 'settings',
    path: '/settings',
    access: 'protected',
    layout: 'app',
    title: 'Settings',
    nav: { icon: 'settings-icon', group: 'sistem' },
    devOnly: false,
    load: () => import('@/pages/SettingsPage.tsx'),
  },
  {
    id: 'login',
    path: '/login',
    access: 'guest',
    layout: 'auth',
    title: 'Masuk',
    nav: false,
    devOnly: false,
    load: () => import('@/pages/LoginPage.tsx'),
  },
  {
    id: 'devUi',
    path: '/dev/ui',
    access: 'any',
    layout: 'app',
    title: 'Design system',
    nav: { icon: 'sidebar-icon', group: 'sistem' },
    devOnly: true,
    // Ternary ini bukan hiasan. Menyaring route dari ACTIVE_ROUTES memang
    // membuatnya tak terjangkau di produksi, tapi `import()`-nya masih
    // tertulis di modul — dan Rollup tetap memancarkan chunk-nya (16 kB yang
    // tak pernah diminta siapa pun). Karena `import.meta.env.DEV` diganti
    // nilai harfiah saat build, cabang dev jadi kode mati di produksi dan
    // acuan ke DevUiPage ikut lenyap bersamanya.
    load: () =>
      import.meta.env.DEV ? import('@/pages/DevUiPage.tsx') : import('@/pages/NotFoundPage.tsx'),
  },
  {
    id: 'notFound',
    path: '*',
    access: 'any',
    layout: 'bare',
    title: 'Halaman tidak ditemukan',
    nav: false,
    devOnly: false,
    load: () => import('@/pages/NotFoundPage.tsx'),
  },
] as const satisfies readonly RouteDefinition[]

type Route = (typeof ROUTE_TABLE)[number]

export type RouteId = Route['id']

/** Route yang punya penempatan di sidebar — `nav` dijamin bukan `false`. */
export type NavRoute = Extract<Route, { nav: NavPlacement }>

/**
 * Peta `{ id: path }` dengan tipe literal — `ROUTES.settings` bertipe
 * `'/settings'`, bukan `string`. Dipakai di seluruh `<Link>` dan `<Navigate>`.
 */
export const ROUTES = Object.fromEntries(ROUTE_TABLE.map((route) => [route.id, route.path])) as {
  readonly [R in Route as R['id']]: R['path']
}

/**
 * Route yang benar-benar dipasang. Entri `devOnly` disaring habis di build
 * produksi — `import.meta.env.DEV` diganti nilai harfiah saat build, jadi
 * penyaringannya terjadi sekali di tingkat modul, bukan tiap render.
 */
export const ACTIVE_ROUTES: readonly RouteDefinition[] = ROUTE_TABLE.filter(
  (route) => !route.devOnly || import.meta.env.DEV,
)

/** Route yang muncul di sidebar, urutannya sesuai ROUTE_TABLE. */
export const NAV_ROUTES: readonly NavRoute[] = ROUTE_TABLE.filter(
  (route): route is NavRoute => route.nav !== false && (!route.devOnly || import.meta.env.DEV),
)

/**
 * Menu sidebar sudah dikelompokkan dan siap dirender: `[{ group, routes }]`,
 * tanpa grup kosong. Sidebar tinggal memetakannya jadi JSX — tidak ada logika
 * pengelompokan yang menyelinap ke dalam komponen.
 */
export const NAV_MENU = NAV_GROUPS.map((group) => ({
  group,
  routes: NAV_ROUTES.filter((route) => route.nav.group === group.id),
})).filter((section) => section.routes.length > 0)

/** Tujuan setelah login berhasil, dan tempat guest dilempar dari route terproteksi. */
export const HOME_ROUTE = ROUTES.dashboard
export const LOGIN_ROUTE = ROUTES.login
