/**
 * Tampilan saat tidak ada data.
 *
 * Selalu menyediakan tempat untuk `action`: keadaan kosong yang baik
 * memberi tahu apa yang harus dilakukan pengguna, bukan cuma memberitahu
 * bahwa tidak ada apa-apa.
 */
import type { ReactNode } from 'react'

import { Icon } from '@/components/Icon.tsx'
import { cn } from '@/utils/cn.ts'

export interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  /** Id simbol di `public/icons.svg`. */
  icon?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  icon = 'documentation-icon',
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}>
      <span className="grid size-12 place-items-center rounded-full bg-surface-sunken text-content-muted">
        <Icon name={icon} className="size-6" />
      </span>

      <div>
        <p className="font-display font-medium text-content">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-content-muted">{description}</p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
