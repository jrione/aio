/**
 * Hook data untuk domain dashboard — inilah yang dipakai komponen.
 *
 * Komponen tidak pernah menyebut path endpoint, tidak pernah memegang
 * `AbortController`, dan tidak pernah menulis query key sendiri. Kalau URL
 * `/dashboard/activities` berubah, yang disunting hanya `dashboard.service.ts`.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { dashboardService } from '@/services/dashboard/dashboard.service.ts'
import type {
  ActivityFilter,
  DashboardFilter,
  TrendFilter,
} from '@/services/dashboard/dashboard.types.ts'

/**
 * Pabrik query key.
 *
 * Disusun berjenjang (`['dashboard'] → ['dashboard','activities'] → …`) supaya
 * satu `invalidateQueries({ queryKey: dashboardKeys.all })` cukup untuk
 * menyegarkan seluruh domain setelah sebuah mutasi, tanpa perlu mendaftar
 * ulang setiap variasi filternya.
 *
 * Filter ikut masuk ke dalam key. Itu bukan detail: tanpanya, mengganti
 * lingkungan akan menampilkan angka lingkungan sebelumnya dari cache sampai
 * request baru selesai — dan angka yang salah terlihat persis seperti angka
 * yang benar.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: (filter: DashboardFilter) => [...dashboardKeys.all, 'summary', filter] as const,
  trend: (filter: TrendFilter) => [...dashboardKeys.all, 'trend', filter] as const,
  activities: (filter: ActivityFilter) => [...dashboardKeys.all, 'activities', filter] as const,
}

/**
 * Menahan data sebelumnya selama data baru diambil.
 *
 * Dipakai seluruh widget yang punya penyaring. Tanpa ini, mengganti pilihan
 * membuat isinya hilang lalu muncul lagi: tinggi kartu runtuh, halaman
 * melompat, dan penyaring yang baru saja diklik berpindah dari bawah kursor.
 * Dengan ini isinya tetap di tempat, hanya diredupkan `<QueryState>` sampai
 * data baru tiba.
 */
const KEEP_PREVIOUS = { placeholderData: keepPreviousData } as const

export function useDashboardSummary(filter: DashboardFilter) {
  return useQuery({
    queryKey: dashboardKeys.summary(filter),
    // `signal` datang dari TanStack Query dan diteruskan sampai ke `fetch`,
    // jadi berpindah halaman benar-benar membatalkan request yang menggantung.
    queryFn: ({ signal }) => dashboardService.getSummary(filter, signal),
    ...KEEP_PREVIOUS,
  })
}

export function useDeploymentTrend(filter: TrendFilter) {
  return useQuery({
    queryKey: dashboardKeys.trend(filter),
    queryFn: ({ signal }) => dashboardService.getTrend(filter, signal),
    ...KEEP_PREVIOUS,
  })
}

export function useActivities(filter: ActivityFilter) {
  return useQuery({
    queryKey: dashboardKeys.activities(filter),
    queryFn: ({ signal }) => dashboardService.listActivities(filter, signal),
    ...KEEP_PREVIOUS,
  })
}
