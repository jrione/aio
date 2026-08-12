/**
 * Indikator proses berjalan.
 *
 * Default-nya `aria-hidden`: sebagian besar spinner muncul di dalam elemen
 * yang sudah mengumumkan statusnya sendiri (tombol yang jadi `aria-busy`,
 * `<output aria-live>` pada fallback route). Beri `label` hanya bila spinner
 * ini berdiri sendiri dan memang perlu diumumkan.
 */
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn.ts'

const spinner = cva('animate-spin', {
  variants: {
    size: {
      sm: 'size-4 border-2',
      md: 'size-5 border-2',
      lg: 'size-8 border-[3px]',
    },
  },
  defaultVariants: { size: 'md' },
})

export interface SpinnerProps extends VariantProps<typeof spinner> {
  className?: string
  /** Teks untuk screen reader. Tanpa ini spinner disembunyikan. */
  label?: string
}

export function Spinner({ size, className, label }: SpinnerProps) {
  return (
    <span
      role={label ? 'status' : undefined}
      aria-hidden={label ? undefined : true}
      className={cn(
        spinner({ size }),
        'inline-block rounded-full border-current border-t-transparent align-middle',
        className,
      )}
    >
      {label && <span className="sr-only">{label}</span>}
    </span>
  )
}
