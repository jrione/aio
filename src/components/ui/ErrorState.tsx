/**
 * Tampilan saat pengambilan data gagal — saudara kembar `EmptyState`.
 *
 * Dua hal yang membedakannya dari sekadar menampilkan pesan error:
 *
 *   1. Selalu ada jalan keluar. `onRetry` menonjol karena sebagian besar
 *      kegagalan di lapisan ini bersifat sementara (jaringan putus, server
 *      sibuk) dan sekali klik memang cukup.
 *   2. `role="alert"` supaya screen reader mengumumkannya begitu muncul.
 *      Kegagalan berbeda dari keadaan kosong: pengguna perlu tahu sekarang,
 *      bukan saat kebetulan menyusuri halaman.
 */
import type { ReactNode } from 'react'

import { Icon } from '@/components/Icon.tsx'
import { Button } from '@/components/ui/Button.tsx'
import { cn } from '@/utils/cn.ts'

export interface ErrorStateProps {
  title?: ReactNode
  /** Umumnya `error.message` — sudah berbahasa Indonesia dan layak tampil. */
  description?: ReactNode
  onRetry?: () => void
  retryLabel?: string
  /** Tindakan tambahan di samping tombol coba lagi. */
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = 'Gagal memuat data',
  description,
  onRetry,
  retryLabel = 'Coba lagi',
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center gap-3 px-6 py-12 text-center', className)}
    >
      <span className="grid size-12 place-items-center rounded-full bg-danger-soft text-danger">
        <Icon name="alert-icon" className="size-6" />
      </span>

      <div>
        <p className="font-display font-medium text-content">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-content-muted">{description}</p>
        )}
      </div>

      {(onRetry ?? action) && (
        <div className="mt-1 flex items-center gap-2">
          {onRetry && (
            <Button variant="secondary" size="sm" onClick={onRetry}>
              <Icon name="refresh-icon" className="size-4" />
              {retryLabel}
            </Button>
          )}
          {action}
        </div>
      )}
    </div>
  )
}
