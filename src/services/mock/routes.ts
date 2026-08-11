/**
 * Daftar seluruh endpoint yang dilayani backend tiruan.
 *
 * Satu-satunya file yang perlu disentuh saat sebuah domain baru butuh mock:
 * tulis handler-nya di `src/services/<domain>/<domain>.mock.ts`, lalu sambungkan
 * di sini. Handler-nya sendiri tinggal berdampingan dengan tipe dan service
 * domainnya, supaya ketiganya tidak bisa menyimpang tanpa ketahuan.
 */
import { dashboardMockRoutes } from '@/services/dashboard/dashboard.mock.ts'
import type { MockRoute } from '@/services/mock/mock-transport.ts'

export const MOCK_ROUTES: readonly MockRoute[] = [...dashboardMockRoutes]
