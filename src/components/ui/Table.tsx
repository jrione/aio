/**
 * Tabel data.
 *
 * Kolomnya dideklarasikan sebagai data, bukan JSX: satu array `columns`
 * menentukan header, perataan, lebar, dan cara tiap sel dirender. Dengan
 * begitu tabel-tabel di aplikasi ini tidak akan menyimpang satu sama lain
 * hanya karena `<td>`-nya diketik ulang di tiap halaman.
 *
 * Generic `Row` menjaga `render` tetap terikat pada bentuk barisnya —
 * mengetik nama field yang tidak ada langsung gagal saat type check.
 */
import type { ReactNode } from 'react'

import { cn } from '@/utils/cn.ts'

export interface TableColumn<Row> {
  /** Kunci unik kolom; juga dipakai sebagai React key. */
  key: string
  header: ReactNode
  render: (row: Row) => ReactNode
  align?: 'left' | 'right' | 'center'
  /** Kelas tambahan untuk sel kolom ini, mis. `w-32` atau `font-mono`. */
  className?: string
}

export interface TableProps<Row> {
  columns: readonly TableColumn<Row>[]
  rows: readonly Row[]
  /** Key stabil per baris. Wajib — indeks array berantakan saat data berubah. */
  rowKey: (row: Row) => string
  /** Ditampilkan menggantikan isi tabel saat `rows` kosong. */
  empty?: ReactNode
  caption?: ReactNode
  className?: string
}

const ALIGNMENT = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
} as const

export function Table<Row>({ columns, rows, rowKey, empty, caption, className }: TableProps<Row>) {
  return (
    // Tabel lebar tidak boleh membuat seluruh halaman bergulir horizontal;
    // yang bergulir cukup tabelnya sendiri.
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        {caption && (
          <caption className="px-5 py-3 text-left text-sm text-content-muted">{caption}</caption>
        )}

        <thead>
          <tr className="border-b border-edge">
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={cn(
                  'px-5 py-3 text-xs font-semibold tracking-wider text-content-muted uppercase',
                  ALIGNMENT[column.align ?? 'left'],
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-10">
                {empty ?? <p className="text-center text-content-muted">Tidak ada data.</p>}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="border-b border-edge last:border-0 hover:bg-surface-sunken"
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'px-5 py-3 text-content',
                      ALIGNMENT[column.align ?? 'left'],
                      column.className,
                    )}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
