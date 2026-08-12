/**
 * Bentuk dasar kontrol form, dipakai bersama `Input` dan `Select`.
 *
 * Tinggal di file sendiri, bukan di salah satu komponen, karena keduanya
 * memakainya — kalau ia hidup di `Input.tsx`, `Select` jadi bergantung pada
 * file komponen lain hanya untuk mengambil kelas.
 */
import { cva } from 'class-variance-authority'

export const control = cva(
  'w-full rounded-lg border bg-surface text-content transition-colors placeholder:text-content-muted disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        sm: 'h-8 px-2.5 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
      invalid: {
        true: 'border-danger',
        false: 'border-edge hover:border-content-muted',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  },
)

/** Id elemen deskripsi sebuah field, untuk dirujuk `aria-describedby`. */
export const describedById = (id: string, kind: 'hint' | 'error') => `${id}-${kind}`
