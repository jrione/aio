/**
 * Kotak isian teks, lengkap dengan label, hint, dan pesan error.
 *
 * `id` wajib karena itulah yang menyambungkan `<label>` ke `<input>` dan
 * pesan error ke `aria-describedby`. Membuatnya opsional (lalu men-generate
 * id acak) memang lebih nyaman, tapi menghasilkan id yang berubah tiap
 * render — dan pengujian jadi sulit menunjuk field mana pun.
 */
import type { InputHTMLAttributes, ReactNode } from 'react'
import type { VariantProps } from 'class-variance-authority'

import { control, describedById } from '@/components/ui/control.ts'
import { Field } from '@/components/ui/Field.tsx'
import { cn } from '@/utils/cn.ts'

export interface InputProps
  extends
    Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    Pick<VariantProps<typeof control>, 'size'> {
  id: string
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  /** Kelas untuk pembungkus field, bukan untuk `<input>`-nya. */
  wrapperClassName?: string
}

export function Input({
  id,
  label,
  hint,
  error,
  size,
  className,
  wrapperClassName,
  ...props
}: InputProps) {
  const invalid = Boolean(error)

  return (
    <Field id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <input
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={
          error ? describedById(id, 'error') : hint ? describedById(id, 'hint') : undefined
        }
        className={cn(control({ size, invalid }), className)}
        {...props}
      />
    </Field>
  )
}
