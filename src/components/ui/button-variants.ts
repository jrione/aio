/**
 * Tabel varian tombol.
 *
 * Dipisah dari `Button.tsx` karena bukan hanya `<button>` yang memakainya:
 * tautan yang tampil sebagai tombol (`<Link className={buttonVariants(...)}>`)
 * harus memakai tabel yang sama persis. Kalau tidak, "tombol" di halaman 404
 * perlahan berbeda dari tombol di tempat lain.
 */
import { cva } from 'class-variance-authority'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-brand-500 text-white hover:bg-brand-600',
        secondary: 'border border-edge bg-surface-raised text-content hover:bg-surface-sunken',
        ghost: 'text-content-muted hover:bg-surface-sunken hover:text-content',
        danger: 'bg-danger text-white hover:bg-danger-strong',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
      block: {
        true: 'w-full',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)
