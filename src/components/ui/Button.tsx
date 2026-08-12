/**
 * Tombol.
 *
 * Seluruh varian dikelola `cva` di `button-variants.ts` — satu tabel varian,
 * bukan `if` bertingkat di JSX. Menambah varian berarti menambah satu baris di
 * tabel itu, dan tipenya ikut menyesuaikan sendiri lewat `VariantProps`.
 *
 * Fokus keyboard tidak diatur di sini: `:focus-visible` global di
 * `src/index.css` sudah memberi outline pada setiap elemen interaktif.
 */
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { VariantProps } from 'class-variance-authority'

import { buttonVariants } from '@/components/ui/button-variants.ts'
import { Spinner } from '@/components/ui/Spinner.tsx'
import { cn } from '@/utils/cn.ts'

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Tampilkan spinner dan matikan tombol selama proses berjalan. */
  loading?: boolean
  children?: ReactNode
}

export function Button({
  variant,
  size,
  block,
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      // Tombol di dalam <form> default-nya submit. Menyerahkan itu pada
      // kelalaian pemanggil terlalu mahal, jadi default-nya dibalik jadi
      // 'button' dan submit harus diminta secara eksplisit.
      type={type}
      disabled={disabled ?? loading}
      aria-busy={loading || undefined}
      className={cn(buttonVariants({ variant, size, block }), className)}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
}
