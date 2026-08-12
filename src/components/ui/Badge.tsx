/**
 * Label status ringkas — status pipeline, hasil deployment, kondisi server.
 *
 * Varian warnanya dipetakan langsung ke token semantik dari Issue #3, jadi
 * `<Badge tone="success">` dan ikon status di tempat lain tidak akan pernah
 * memakai hijau yang berbeda.
 */
import type { ReactNode } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/utils/cn.ts'

const badge = cva(
  'inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ring',
  {
    variants: {
      tone: {
        neutral: 'bg-surface-sunken text-content-muted ring-edge',
        success: 'bg-success-soft text-success-strong ring-success/30',
        warning: 'bg-warning-soft text-warning-strong ring-warning/30',
        danger: 'bg-danger-soft text-danger-strong ring-danger/30',
        info: 'bg-info-soft text-info-strong ring-info/30',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-1 text-sm',
      },
    },
    defaultVariants: { tone: 'neutral', size: 'sm' },
  },
)

export interface BadgeProps extends VariantProps<typeof badge> {
  className?: string
  /** Bulatan kecil sewarna teks di depan label. */
  dot?: boolean
  children: ReactNode
}

export function Badge({ tone, size, dot = false, className, children }: BadgeProps) {
  return (
    <span className={cn(badge({ tone, size }), className)}>
      {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}
