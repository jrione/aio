/**
 * Mengisi segmen dinamis sebuah pola route.
 *
 * `ROUTES.deployments` bertipe literal `'/deployments'`, jadi salah ketik
 * langsung tertangkap type check. Begitu sebuah route punya segmen dinamis
 * (`'/deployments/:id'`), jaminan itu hilang: yang dibutuhkan `<Link to>` adalah
 * `/deployments/dep-004`, dan cara paling mudah mendapatkannya adalah menempel
 * string di komponen — persis kebiasaan yang dilarang `routes.ts`.
 *
 * Fungsi ini mengembalikan jaminan tersebut. Nama parameternya dibaca **dari
 * polanya sendiri** lewat tipe `PathParams` di bawah, jadi
 * `buildPath(ROUTES.deploymentDetail, { di: '1' })` gagal saat type check, bukan
 * saat tautannya diklik dan mendarat di halaman 404.
 */

/**
 * Nama segmen dinamis di dalam sebuah pola, sebagai union.
 *
 * `'/deployments/:id'` → `'id'`; `'/a/:x/b/:y'` → `'x' | 'y'`; pola tanpa
 * segmen dinamis → `never`, yang membuat argumen keduanya jadi objek kosong.
 */
type PathParams<Pattern extends string> = Pattern extends `${string}:${infer Tail}`
  ? Tail extends `${infer Name}/${infer Rest}`
    ? Name | PathParams<`/${Rest}`>
    : Tail
  : never

/** Segmen dinamis: `:` diikuti huruf, angka, atau garis bawah. */
const DYNAMIC_SEGMENT = /:([A-Za-z0-9_]+)/g

export function buildPath<Pattern extends string>(
  pattern: Pattern,
  params: Record<PathParams<Pattern>, string>,
): string {
  // `Record<'id', string>` adalah mapped type, jadi TypeScript memberinya index
  // signature implisit dan pelebaran ini tidak butuh `as` sama sekali.
  const lookup: Readonly<Record<string, string | undefined>> = params

  return pattern.replace(DYNAMIC_SEGMENT, (_match, name: string) => {
    const value = lookup[name]
    if (value === undefined) {
      // Tidak akan pernah terjadi lewat jalur yang bertipe. Yang dijaga di sini
      // adalah pemanggilan dari kode yang tipenya sudah terlanjur melebar jadi
      // `string` — dan gagal berisik jauh lebih baik daripada menghasilkan
      // `/deployments/` yang diam-diam mendarat di daftar.
      throw new Error(`Parameter "${name}" tidak diisi untuk pola "${pattern}".`)
    }
    return encodeURIComponent(value)
  })
}
