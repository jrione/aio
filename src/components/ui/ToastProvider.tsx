/**
 * Penyedia notifikasi toast beserta tempat tampilnya.
 *
 * Dipasang sekali membungkus aplikasi; komponen mana pun cukup memanggil
 * `useToast().show({ ... })` tanpa perlu tahu di mana toast dirender.
 *
 * Wadahnya `aria-live="polite"` dan berada di luar alur baca — screen reader
 * membacakan pesan baru tanpa memindahkan fokus pengguna dari pekerjaannya.
 */
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import { Icon } from '@/components/Icon.tsx'
import {
  ToastContext,
  type Toast,
  type ToastContextValue,
  type ToastOptions,
  type ToastTone,
} from '@/components/ui/toast-context.ts'
import { cn } from '@/utils/cn.ts'

const TONE_CLASSES: Record<ToastTone, string> = {
  success: 'border-success/40 bg-success-soft text-success-strong',
  warning: 'border-warning/40 bg-warning-soft text-warning-strong',
  danger: 'border-danger/40 bg-danger-soft text-danger-strong',
  info: 'border-info/40 bg-info-soft text-info-strong',
}

const DEFAULT_DURATION = 5000

/**
 * Penomor id toast.
 *
 * Sengaja bukan `crypto.randomUUID()`: API itu hanya tersedia di secure
 * context, jadi ia melempar TypeError begitu aplikasi dibuka lewat http://
 * di alamat LAN — persis yang terjadi saat menguji dev server dari perangkat
 * lain, dan toast pun mati total tanpa gejala lain. Id ini toh hanya perlu
 * unik di dalam satu sesi halaman; keacakan tidak memberi apa pun di sini.
 */
let nextToastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer !== undefined) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts((current) => current.filter((toast) => toast.id !== id))
  }, [])

  const show = useCallback(
    (options: ToastOptions) => {
      nextToastId += 1
      const id = `toast-${String(nextToastId)}`
      setToasts((current) => [...current, { ...options, id }])

      const duration = options.duration ?? DEFAULT_DURATION
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => {
            dismiss(id)
          }, duration),
        )
      }

      return id
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-lg',
              TONE_CLASSES[toast.tone ?? 'info'],
            )}
          >
            <div className="min-w-0 grow">
              <p className="font-medium">{toast.title}</p>
              {toast.description && <p className="mt-1 text-sm opacity-90">{toast.description}</p>}
            </div>

            <button
              type="button"
              onClick={() => {
                dismiss(toast.id)
              }}
              aria-label="Tutup notifikasi"
              className="shrink-0 rounded p-1 transition-opacity hover:opacity-70"
            >
              <Icon name="close-icon" className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
