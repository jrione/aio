/**
 * Halaman 404 (route `*`).
 *
 * Cocok dengan URL apa pun yang tidak ada di `ROUTE_TABLE`. Tidak dijaga guard
 * supaya pesannya jujur: URL-nya memang tidak ada, bukan "kamu belum login".
 */
import { Link } from 'react-router'

import { HOME_ROUTE } from '@/routes/routes.ts'

export default function NotFoundPage() {
  return (
    <div className="text-center">
      <p className="font-mono text-sm font-medium text-brand-600">404</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-content">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-3 text-content-muted">URL yang kamu buka tidak terdaftar di aplikasi ini.</p>

      <Link
        to={HOME_ROUTE}
        className="mt-6 inline-flex rounded-lg bg-brand-500 px-4 py-2 font-medium text-white transition-colors hover:bg-brand-600"
      >
        Kembali ke dashboard
      </Link>
    </div>
  )
}
