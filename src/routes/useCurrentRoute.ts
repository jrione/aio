/**
 * Entri `ROUTE_TABLE` yang cocok dengan URL saat ini.
 *
 * Dipakai header untuk menampilkan judul halaman tanpa tiap halaman perlu
 * mengumumkan judulnya sendiri — judulnya sudah ada di tabel route, dan itu
 * pula yang dipakai sidebar dan `document.title`.
 */
import { matchPath, useLocation } from 'react-router'

import { ROUTE_TABLE, type RouteDefinition } from '@/routes/routes.ts'

export function useCurrentRoute(): RouteDefinition {
  const { pathname } = useLocation()

  // Urutan ROUTE_TABLE menentukan pemenangnya, dan entri '*' ada di paling
  // bawah — jadi pencarian ini selalu berakhir di route 404 bila tidak ada
  // yang cocok, sama seperti yang dilakukan React Router sendiri.
  const matched = ROUTE_TABLE.find((route) => matchPath(route.path, pathname) !== null)

  if (!matched) {
    throw new Error(`Tidak ada route yang cocok untuk "${pathname}" — entri '*' hilang?`)
  }

  return matched
}
