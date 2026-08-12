/**
 * Merakit konfigurasi React Router dari `ROUTE_TABLE`.
 *
 * Tidak ada daftar route kedua di file ini — semuanya diturunkan. Route
 * dikelompokkan per layout supaya berpindah antar halaman dalam satu layout
 * (mis. Dashboard → Settings) tidak me-mount ulang kerangkanya; hanya isi
 * `<Outlet>` yang berganti. Itu juga yang membuat perpindahan terasa instan
 * dan tidak memicu reload penuh.
 *
 * `lazy()` dipanggil sekali di tingkat modul, bukan saat render. Memanggilnya
 * di dalam komponen akan menghasilkan tipe komponen baru tiap render, dan
 * React akan me-mount ulang halaman setiap kali.
 */
import { Suspense, lazy } from 'react'
import type { ComponentType } from 'react'
import { createBrowserRouter, type RouteObject } from 'react-router'

import { AppLayout } from '@/layouts/AppLayout.tsx'
import { AuthLayout } from '@/layouts/AuthLayout.tsx'
import { BareLayout } from '@/layouts/BareLayout.tsx'
import { DocumentTitle } from '@/routes/DocumentTitle.tsx'
import { RouteFallback } from '@/routes/RouteFallback.tsx'
import { RouteGuard } from '@/routes/RouteGuard.tsx'
import { ACTIVE_ROUTES, type RouteDefinition, type RouteLayout } from '@/routes/routes.ts'

const LAYOUT_COMPONENTS = {
  app: AppLayout,
  auth: AuthLayout,
  bare: BareLayout,
} as const satisfies Record<RouteLayout, ComponentType>

const toRouteObject = (route: RouteDefinition): RouteObject => {
  const Page = lazy(route.load)

  return {
    // React Router memperlakukan path kosong sebagai index route di dalam
    // layout, jadi '/' dipetakan ke `index: true`.
    ...(route.path === '/' ? { index: true } : { path: route.path }),
    element: (
      <DocumentTitle title={route.title}>
        <RouteGuard access={route.access}>
          <Suspense fallback={<RouteFallback />}>
            <Page />
          </Suspense>
        </RouteGuard>
      </DocumentTitle>
    ),
  }
}

const routeObjects: RouteObject[] = Object.entries(LAYOUT_COMPONENTS)
  .map(([layout, Layout]) => ({
    element: <Layout />,
    children: ACTIVE_ROUTES.filter((route) => route.layout === layout).map(toRouteObject),
  }))
  .filter((group) => group.children.length > 0)

export const router = createBrowserRouter(routeObjects)
