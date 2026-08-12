/**
 * Wadah konten dengan border dan latar terangkat.
 *
 * `title`, `description`, `actions`, dan `footer` opsional — kalau tidak
 * diberikan, bagiannya tidak dirender sama sekali sehingga tidak ada padding
 * atau garis yang menggantung.
 */
import type { ReactNode } from 'react'

import { cn } from '@/utils/cn.ts'

export interface CardProps {
  title?: ReactNode
  description?: ReactNode
  /** Ditempatkan di kanan judul — biasanya tombol. */
  actions?: ReactNode
  footer?: ReactNode
  className?: string
  /** Kelas untuk area isi. Beri `p-0` bila isinya tabel yang menempel tepi. */
  bodyClassName?: string
  children?: ReactNode
}

export function Card({
  title,
  description,
  actions,
  footer,
  className,
  bodyClassName,
  children,
}: CardProps) {
  const hasHeader = Boolean(title ?? description ?? actions)

  return (
    <section
      className={cn('overflow-hidden rounded-xl border border-edge bg-surface-raised', className)}
    >
      {hasHeader && (
        <header className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4">
          <div className="min-w-0">
            {title && <h2 className="truncate font-display font-medium text-content">{title}</h2>}
            {description && <p className="mt-1 text-sm text-content-muted">{description}</p>}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </header>
      )}

      {children && <div className={cn('p-5', bodyClassName)}>{children}</div>}

      {footer && (
        <footer className="border-t border-edge bg-surface px-5 py-3 text-sm text-content-muted">
          {footer}
        </footer>
      )}
    </section>
  )
}
