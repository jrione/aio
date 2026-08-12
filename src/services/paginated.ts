/**
 * Amplop standar untuk daftar berhalaman.
 *
 * Dipakai semua domain supaya `Pagination` di UI tidak perlu tahu ia sedang
 * menampilkan aktivitas, deployment, atau pengguna — bentuk metadatanya selalu
 * sama. Backend yang mengembalikan bentuk lain dinormalkan di service-nya
 * masing-masing, bukan di komponen.
 */
export interface Paginated<Item> {
  readonly items: readonly Item[]
  /** Halaman saat ini, dihitung dari 1 — sama dengan yang dipakai `Pagination`. */
  readonly page: number
  readonly pageSize: number
  /** Total item di seluruh halaman, bukan hanya halaman ini. */
  readonly total: number
  readonly pageCount: number
}

export interface PageParams {
  page?: number
  pageSize?: number
}

export const DEFAULT_PAGE_SIZE = 8

/**
 * Memotong satu halaman dari daftar lengkap.
 *
 * Ada di lapisan service (bukan hanya di mock) karena beberapa endpoint memang
 * mengembalikan daftar utuh dan halamannya dihitung di klien. Menaruhnya di
 * sini menjaga `pageCount` dihitung dengan cara yang sama di mana pun.
 */
export function paginate<Item>(
  items: readonly Item[],
  { page = 1, pageSize = DEFAULT_PAGE_SIZE }: PageParams = {},
): Paginated<Item> {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  // Halaman di luar jangkauan dijepit, bukan dibiarkan mengembalikan array
  // kosong: pengguna yang menyimpan URL `?page=99` lalu datanya menyusut akan
  // melihat halaman terakhir, bukan tabel kosong yang membingungkan.
  const current = Math.min(Math.max(1, page), pageCount)
  const start = (current - 1) * pageSize

  return {
    items: items.slice(start, start + pageSize),
    page: current,
    pageSize,
    total: items.length,
    pageCount,
  }
}
