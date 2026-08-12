/**
 * Service domain dashboard.
 *
 * Satu-satunya lapisan yang tahu path endpoint dan nama parameter query untuk
 * domain ini. Komponen memanggil hook di `dashboard.queries.ts`, hook memanggil
 * service ini, service memanggil `http`. Tidak ada yang melompati urutan itu —
 * dijaga `npm run check:layers`.
 *
 * Ditulis **sekali** untuk mode mock maupun API asli: yang berbeda antara
 * keduanya hanya fungsi `fetch` di dalam `http.ts`. Lihat catatan panjang di
 * `src/services/mock/mock-transport.ts` untuk alasannya.
 */
import type {
  Activity,
  ActivityFilter,
  DashboardFilter,
  DashboardSummary,
  DeploymentTrend,
  TrendFilter,
} from '@/services/dashboard/dashboard.types.ts'
import { http } from '@/services/http.ts'
import type { Paginated } from '@/services/paginated.ts'

export const dashboardService = {
  getSummary: ({ environment }: DashboardFilter, signal?: AbortSignal) =>
    http.get<DashboardSummary>('/dashboard/summary', { query: { environment }, signal }),

  getTrend: ({ range, environment }: TrendFilter, signal?: AbortSignal) =>
    http.get<DeploymentTrend>('/dashboard/trend', { query: { range, environment }, signal }),

  listActivities: ({ page, pageSize, status, environment }: ActivityFilter, signal?: AbortSignal) =>
    http.get<Paginated<Activity>>('/dashboard/activities', {
      // Entri `undefined` dibuang `http.ts`, jadi filter kosong tidak
      // mengirimkan `?status=undefined` ke server.
      query: { page, pageSize, status, environment },
      signal,
    }),
}
