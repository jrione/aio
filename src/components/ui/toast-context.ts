/**
 * Kontrak notifikasi toast, terpisah dari komponennya.
 *
 * Context dan hook tinggal di file `.ts` ini supaya `ToastProvider.tsx`
 * hanya mengekspor komponen — syarat agar Fast Refresh tetap bekerja untuk
 * provider-nya.
 */
import { createContext, use } from 'react'

export type ToastTone = 'success' | 'warning' | 'danger' | 'info'

export interface ToastOptions {
  title: string
  description?: string
  tone?: ToastTone
  /** Lama tampil dalam milidetik. `0` berarti menetap sampai ditutup. */
  duration?: number
}

export interface Toast extends ToastOptions {
  id: string
}

export interface ToastContextValue {
  /** Menampilkan toast; mengembalikan id-nya agar bisa ditutup lebih awal. */
  show: (options: ToastOptions) => string
  dismiss: (id: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const value = use(ToastContext)
  if (!value) {
    throw new Error('useToast() dipakai di luar <ToastProvider>')
  }
  return value
}
