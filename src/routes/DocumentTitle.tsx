/**
 * Menyetel `document.title` sesuai route yang sedang aktif.
 *
 * Judulnya diambil dari field `title` di `ROUTE_TABLE`, jadi nama tab dan nama
 * menu tidak pernah berbeda. Nama aplikasi dibaca dari `env` — sama seperti
 * `%VITE_APP_NAME%` di index.html — supaya keduanya tidak saling menyimpang.
 */
import { useEffect } from 'react'
import type { ReactNode } from 'react'

import { env } from '@/config/env.ts'

interface DocumentTitleProps {
  title: string
  children: ReactNode
}

export function DocumentTitle({ title, children }: DocumentTitleProps) {
  useEffect(() => {
    document.title = `${title} · ${env.appName}`
  }, [title])

  return children
}
