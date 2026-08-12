/**
 * Halaman 404 (route `*`).
 *
 * Cocok dengan URL apa pun yang tidak ada di `ROUTE_TABLE`. Tidak dijaga guard
 * supaya pesannya jujur: URL-nya memang tidak ada, bukan "kamu belum login".
 */
import { Link } from 'react-router'

import { buttonVariants } from '@/components/ui/button-variants.ts'
import { HOME_ROUTE } from '@/routes/routes.ts'

export default function NotFoundPage() {
  return (
    <div className="text-center">
      <p className="font-mono text-sm font-medium text-brand-600">404</p>
      <h1 className="mt-2 font-display text-3xl font-medium tracking-tight text-content">
        Halaman tidak ditemukan
      </h1>
      <p className="mt-3 text-content-muted">URL yang kamu buka tidak terdaftar di aplikasi ini.</p>

      {/* Ini navigasi, jadi elemennya <Link> — tampilannya saja yang meminjam
          tabel varian tombol supaya tidak menyimpang dari tombol lain. */}
      <Link to={HOME_ROUTE} className={`mt-6 ${buttonVariants()}`}>
        Kembali ke dashboard
      </Link>
    </div>
  )
}
