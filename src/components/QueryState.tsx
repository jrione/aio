/**
 * Menerjemahkan sebuah query jadi salah satu dari empat keadaan tampilan:
 * memuat, gagal, kosong, atau berisi.
 *
 * Acceptance criteria Issue #8 menuntut **setiap** request punya penanganan
 * keempatnya. Kalau itu diserahkan pada kedisiplinan tiap halaman, cepat atau
 * lambat akan ada halaman yang lupa menangani `isError` dan hanya menampilkan
 * layar kosong saat server mati. Dengan pembungkus ini keempat keadaan itu
 * struktural: melewatkan salah satunya tidak mungkin, karena bukan pemanggil
 * yang menuliskannya.
 *
 * Tinggal di `src/components/` (bukan `components/ui/`) karena ia mengenal
 * TanStack Query — bukan primitif design system yang bebas konteks.
 */
import type { ReactNode } from 'react'
import type { UseQueryResult } from '@tanstack/react-query'

import { ErrorState } from '@/components/ui/ErrorState.tsx'
import { Spinner } from '@/components/ui/Spinner.tsx'
import { cn } from '@/utils/cn.ts'

export interface QueryStateProps<Data> {
  query: UseQueryResult<Data>
  /** Dirender saat data sudah ada dan tidak kosong. */
  children: (data: Data) => ReactNode
  /** Menentukan apakah data dianggap kosong. Tanpa ini, data apa pun dianggap berisi. */
  isEmpty?: (data: Data) => boolean
  /** Dirender saat `isEmpty` bernilai true. Biasanya `<EmptyState>`. */
  empty?: ReactNode
  /** Mengganti spinner default, mis. dengan skeleton yang seukuran isinya. */
  loading?: ReactNode
  /** Judul pada tampilan gagal. Pesannya sendiri selalu diambil dari error. */
  errorTitle?: string
  className?: string
}

export function QueryState<Data>({
  query,
  children,
  isEmpty,
  empty,
  loading,
  errorTitle,
  className,
}: QueryStateProps<Data>) {
  // `isPending` berarti belum pernah ada data sama sekali. Berbeda dari
  // `isFetching`, yang juga menyala saat menyegarkan data yang sudah tampil —
  // itu ditangani di bagian bawah sebagai peredupan, bukan sebagai spinner
  // yang membuang isi layar.
  if (query.isPending) {
    return (
      <div className={cn('flex items-center justify-center px-6 py-12', className)}>
        {loading ?? <Spinner size="lg" label="Memuat data" className="text-content-muted" />}
      </div>
    )
  }

  if (query.isError) {
    return (
      <ErrorState
        title={errorTitle}
        description={query.error.message}
        onRetry={() => void query.refetch()}
        className={className}
      />
    )
  }

  const body = isEmpty?.(query.data) === true ? empty : children(query.data)

  // Menyegarkan data yang sudah tampil: isinya tetap di tempat, hanya diredupkan
  // dan ditandai `aria-busy` supaya perubahannya tidak terasa seperti kedipan
  // tanpa sebab — terutama saat berpindah halaman pada tabel berhalaman.
  if (query.isFetching) {
    return (
      <div aria-busy="true" className={cn('opacity-60 transition-opacity', className)}>
        {body}
      </div>
    )
  }

  return <div className={className}>{body}</div>
}
