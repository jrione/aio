/**
 * Dialog modal.
 *
 * Dibangun di atas `<dialog>` bawaan browser dengan `showModal()`. Itu bukan
 * jalan pintas — justru sebaliknya. `showModal()` memberi tiga hal yang paling
 * sering salah di modal buatan sendiri, langsung dari browser:
 *
 *   1. focus trap sungguhan — Tab tidak bisa keluar dari dialog
 *   2. Escape menutup, tanpa listener global yang perlu dibersihkan
 *   3. top layer — dialog selalu di atas segalanya, tanpa perang `z-index`
 *
 * Itu pula alasan project ini belum menambah library headless: untuk modal,
 * platform-nya sudah menyediakan yang benar. Kalau nanti butuh combobox atau
 * menu bertingkat, barulah pertimbangkan library — dan komponen ini tidak
 * perlu ikut berubah.
 */
import { useEffect, useRef, type ReactNode } from 'react'

import { Button } from '@/components/ui/Button.tsx'
import { Icon } from '@/components/Icon.tsx'
import { cn } from '@/utils/cn.ts'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title: ReactNode
  description?: ReactNode
  /** Tombol aksi di kaki dialog. */
  footer?: ReactNode
  className?: string
  children?: ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  className,
  children,
}: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    // showModal() melempar bila dialog sudah terbuka, jadi statusnya dicek
    // dulu — render ulang karena sebab lain tidak boleh membukanya dua kali.
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      // Escape memicu 'cancel', tombol close memicu 'close'. Keduanya
      // dialirkan ke onClose supaya state pemanggil tidak pernah tertinggal
      // menganggap dialog masih terbuka.
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClose={onClose}
      // Klik di luar isi dialog: <dialog> menerima klik pada backdrop-nya
      // sebagai klik pada dirinya sendiri, jadi target yang tepat sama dengan
      // elemen dialog berarti pengguna mengklik di luar.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-edge bg-surface-raised p-0 text-content backdrop:bg-black/50',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-edge px-5 py-4">
        <div className="min-w-0">
          <h2 id="modal-title" className="font-display font-medium text-content">
            {title}
          </h2>
          {description && <p className="mt-1 text-sm text-content-muted">{description}</p>}
        </div>

        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Tutup dialog">
          <Icon name="close-icon" />
        </Button>
      </div>

      {children && <div className="px-5 py-4">{children}</div>}

      {footer && (
        <div className="flex justify-end gap-2 border-t border-edge px-5 py-4">{footer}</div>
      )}
    </dialog>
  )
}
