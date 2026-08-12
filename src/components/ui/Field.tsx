/**
 * Pembungkus label + hint + pesan error untuk kontrol form.
 *
 * Dipakai bersama `Input` dan `Select` supaya keduanya menghubungkan label
 * dan pesan error ke kontrolnya dengan cara yang sama persis. Menyalin
 * pola `id` / `aria-describedby` di tiap komponen form adalah cara termudah
 * membuat salah satunya diam-diam tidak terbaca screen reader.
 */
import type { ReactNode } from 'react'

import { describedById } from '@/components/ui/control.ts'
import { cn } from '@/utils/cn.ts'

export interface FieldProps {
  id: string
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  className?: string
  children: ReactNode
}

export function Field({ id, label, hint, error, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-content">
          {label}
        </label>
      )}

      {children}

      {hint && !error && (
        <p id={describedById(id, 'hint')} className="text-xs text-content-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={describedById(id, 'error')} className="text-xs text-danger-strong">
          {error}
        </p>
      )}
    </div>
  )
}
