/**
 * Tampilan selagi chunk halaman diunduh (`<Suspense fallback>`).
 *
 * Skeleton, bukan spinner, dan itu keputusan Issue #14. Alasannya bukan estetika:
 * spinner berukuran tetap membuat tinggi halaman runtuh jadi satu baris, lalu
 * melompat ke tinggi penuh begitu isinya tiba. Skeleton yang kira-kira seukuran
 * halaman sungguhan membuat perpindahan terasa seperti isi yang sedang muncul,
 * bukan seperti halaman yang berkedip.
 *
 * Bentuknya sengaja umum — sebaris judul, deret kartu, satu blok besar — karena
 * ia harus melayani halaman mana pun. Halaman yang tahu persis bentuk isinya
 * memakai skeleton miliknya sendiri lewat `<QueryState loading={…}>`; yang ini
 * hanya menjembatani jeda sebelum komponennya ada.
 *
 * `aria-busy` dan `aria-live` ada supaya pengguna screen reader ikut tahu ada
 * sesuatu yang sedang dimuat. Tanpanya, skeleton hanyalah beberapa kotak abu-abu
 * yang tidak mengumumkan apa pun.
 */
import { Skeleton } from '@/components/ui/Skeleton.tsx'

const CARDS = ['a', 'b', 'c', 'd']

export function RouteFallback() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex w-full flex-col gap-6">
      <span className="sr-only">Memuat halaman…</span>

      <Skeleton className="h-5 w-64" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((id) => (
          <Skeleton key={id} className="h-24 w-full" />
        ))}
      </div>

      <Skeleton className="h-72 w-full" />
    </div>
  )
}
