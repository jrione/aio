/**
 * Menghitung nomor halaman yang tampil di komponen `Pagination`.
 *
 * Fungsi murni, dipisah dari komponennya supaya logikanya bisa dibaca dan
 * diuji tanpa merender apa pun — di situlah bug pagination biasanya
 * bersembunyi, bukan di JSX-nya.
 */

export const ELLIPSIS = 'ellipsis'

export type PageItem = number | typeof ELLIPSIS

/**
 * Selalu memuat halaman pertama, terakhir, halaman aktif, dan satu tetangga
 * di tiap sisinya. Sisanya diringkas jadi elipsis, sehingga barisnya tidak
 * pernah melebar mengikuti banyaknya data.
 */
export function pageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= 7) return Array.from({ length: pageCount }, (_, index) => index + 1)

  const around = [page - 1, page, page + 1].filter((n) => n > 1 && n < pageCount)
  const items: PageItem[] = [1]

  const first = around[0]
  if (first !== undefined && first > 2) items.push(ELLIPSIS)

  items.push(...around)

  const last = around.at(-1)
  if (last !== undefined && last < pageCount - 1) items.push(ELLIPSIS)

  items.push(pageCount)

  return items
}
