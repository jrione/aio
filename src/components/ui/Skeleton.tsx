/**
 * Bentuk abu-abu yang menempati ruang isi sementara datanya diambil.
 *
 * Bedanya dengan spinner bukan soal selera. Spinner memberi tahu bahwa sesuatu
 * sedang terjadi tapi tidak memberi tahu apa yang akan muncul, dan begitu data
 * tiba, tata letaknya melompat dari "kotak kosong berisi spinner" jadi isi
 * sungguhan. Skeleton yang seukuran isinya membuat halaman diam di tempat —
 * yang paling terasa pada grafik, yang tingginya besar dan runtuh total selagi
 * menunggu.
 *
 * Karena itu skeleton hanya pantas dipakai kalau ukurannya memang bisa ditebak
 * lebih dulu. Untuk isi yang tingginya tak tentu, spinner justru lebih jujur.
 *
 * `aria-hidden` karena keadaan memuat sudah diumumkan `<QueryState>` lewat
 * `aria-busy`; membacakan sederet kotak kosong tidak menambah apa pun.
 */
import { cn } from '@/utils/cn.ts'

export interface SkeletonProps {
  /** Ukuran dan bentuknya, mis. `h-4 w-32` atau `h-64 w-full`. */
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        // `motion-reduce` bukan pelengkap: denyut yang terus-menerus adalah
        // salah satu pemicu paling umum bagi pengguna yang sensitif terhadap
        // gerakan, dan mereka sudah menyatakannya lewat setelan sistem.
        'animate-pulse rounded-lg bg-surface-sunken motion-reduce:animate-none',
        className,
      )}
    />
  )
}
