/**
 * Hook data untuk domain dashboard — inilah yang dipakai komponen.
 *
 * Komponen tidak pernah menyebut path endpoint, tidak pernah memegang
 * `AbortController`, dan tidak pernah menulis query key sendiri. Kalau URL
 * `/dashboard/activities` berubah, yang disunting hanya `dashboard.service.ts`.
 */
import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { dashboardService } from '@/services/dashboard/dashboard.service.ts'
import type { ActivityFilter } from '@/services/dashboard/dashboard.types.ts'

/**
 * Pabrik query key.
 *
 * Disusun berjenjang (`['dashboard'] → ['dashboard','activities'] → …`) supaya
 * satu `invalidateQueries({ queryKey: dashboardKeys.all })` cukup untuk
 * menyegarkan seluruh domain setelah sebuah mutasi, tanpa perlu mendaftar
 * ulang setiap variasi filternya.
 */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  activities: (filter: ActivityFilter) => [...dashboardKeys.all, 'activities', filter] as const,
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    // `signal` datang dari TanStack Query dan diteruskan sampai ke `fetch`,
    // jadi berpindah halaman benar-benar membatalkan request yang menggantung.
    queryFn: ({ signal }) => dashboardService.getSummary(signal),
  })
}

export function useActivities(filter: ActivityFilter) {
  return useQuery({
    queryKey: dashboardKeys.activities(filter),
    queryFn: ({ signal }) => dashboardService.listActivities(filter, signal),

    /**
     * Menahan data halaman sebelumnya selama halaman baru diambil.
     *
     * Tanpa ini, menekan "halaman 2" membuat tabel berkedip kosong lalu terisi
     * lagi, dan tinggi halaman melompat. Dengan ini barisnya tetap terlihat,
     * hanya diredupkan oleh `<QueryState>` sampai data baru tiba.
     */
    placeholderData: keepPreviousData,
  })
}
