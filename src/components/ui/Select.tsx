/**
 * Pilihan dari daftar tetap.
 *
 * Dibangun di atas `<select>` bawaan browser, bukan dropdown buatan sendiri.
 * Alasannya aksesibilitas: `<select>` sudah benar soal keyboard, screen
 * reader, dan — yang paling sering terlupa — perilaku di mobile, tempat
 * sistem operasi menampilkan pemilih miliknya sendiri. Dropdown custom baru
 * layak dibangun kalau memang butuh pencarian atau pilihan berikon, dan itu
 * akan jadi komponen terpisah, bukan mengganti yang ini.
 */
import type { ReactNode, SelectHTMLAttributes } from 'react'
import type { VariantProps } from 'class-variance-authority'

import { control, describedById } from '@/components/ui/control.ts'
import { Field } from '@/components/ui/Field.tsx'
import { Icon } from '@/components/Icon.tsx'
import { cn } from '@/utils/cn.ts'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps
  extends
    Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'children'>,
    Pick<VariantProps<typeof control>, 'size'> {
  id: string
  options: readonly SelectOption[]
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  /** Baris kosong terpilih di awal, mis. "Pilih lingkungan". */
  placeholder?: string
  wrapperClassName?: string
}

export function Select({
  id,
  options,
  label,
  hint,
  error,
  placeholder,
  size,
  className,
  wrapperClassName,
  ...props
}: SelectProps) {
  const invalid = Boolean(error)

  return (
    <Field id={id} label={label} hint={hint} error={error} className={wrapperClassName}>
      <div className="relative">
        <select
          id={id}
          aria-invalid={invalid || undefined}
          aria-describedby={
            error ? describedById(id, 'error') : hint ? describedById(id, 'hint') : undefined
          }
          className={cn(control({ size, invalid }), 'appearance-none pr-9', className)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        {/* Panah bawaan disembunyikan lewat appearance-none supaya bentuknya
            sama di semua browser; ini penggantinya. */}
        <Icon
          name="chevron-down-icon"
          className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-content-muted"
        />
      </div>
    </Field>
  )
}
