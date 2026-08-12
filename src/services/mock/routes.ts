/**
 * Perakitan backend tiruan: seluruh endpoint-nya, plus middleware auth-nya.
 *
 * Satu-satunya file yang perlu disentuh saat sebuah domain baru butuh mock:
 * tulis handler-nya di `src/services/<domain>/<domain>.mock.ts`, lalu sambungkan
 * di sini. Handler-nya sendiri tinggal berdampingan dengan tipe dan service
 * domainnya, supaya ketiganya tidak bisa menyimpang tanpa ketahuan.
 *
 * Pemeriksa token ikut diteruskan dari sini, bukan diimpor langsung oleh
 * `mock-transport.ts`. Dengan begitu transport tetap tidak tahu-menahu soal
 * domain mana pun — ia hanya tahu ada "daftar route" dan ada "cara memeriksa
 * siapa pemanggilnya", persis seperti kerangka server yang memasang middleware
 * dari modul auth-nya.
 */
import { authorizeMockRequest, authMockRoutes } from '@/services/auth/auth.mock.ts'
import { dashboardMockRoutes } from '@/services/dashboard/dashboard.mock.ts'
import type { MockRoute } from '@/services/mock/mock-transport.ts'

export { authorizeMockRequest }

export const MOCK_ROUTES: readonly MockRoute[] = [...authMockRoutes, ...dashboardMockRoutes]
