/**
 * Lingkungan tempat sesuatu dijalankan — kosakata bersama lintas domain.
 *
 * Sampai Issue #11 tipe ini tinggal di `dashboard.types.ts`, dan itu benar
 * selama hanya dashboard yang memakainya. Begitu modul Deployments di Issue #12
 * ikut memakainya, membiarkannya di sana berarti domain baru harus mengimpor
 * tipe dari domain lain hanya untuk menyebut "production" — dan arah impor
 * seperti itu adalah cara termudah membuat dua domain saling terikat tanpa
 * alasan.
 *
 * Yang ada di sini hanya kontrak, bukan tampilan: tipe dan daftar nilainya.
 * Label berbahasa Indonesia-nya ada di `src/features/formatters.ts`, karena itu
 * urusan lapisan tampilan dan bisa berubah tanpa mengubah apa pun di server.
 */
export type DeploymentEnvironment = 'production' | 'staging' | 'sandbox'

/**
 * Daftar nilainya sebagai array, bukan hanya sebagai union.
 *
 * Union hanya hidup saat type check; yang dibutuhkan saat runtime — mengisi
 * `<select>`, memvalidasi query string, menyaring data tiruan — adalah array
 * ini. Menulis keduanya terpisah membuat keduanya bisa menyimpang, jadi
 * `satisfies` di bawah memaksa isinya tetap sama persis dengan union di atas.
 *
 * Daftarnya tetap di sisi klien untuk sekarang. Backend sungguhan biasanya
 * menyajikannya sebagai endpoint tersendiri — lingkungan datang dan pergi
 * seiring project — dan saat itu tiba yang berubah cuma file ini beserta satu
 * hook baru, bukan komponen yang memakainya.
 */
export const ENVIRONMENTS = [
  'production',
  'staging',
  'sandbox',
] as const satisfies readonly DeploymentEnvironment[]

/**
 * Penyaring yang berlaku untuk seluruh widget dashboard sekaligus.
 *
 * Ditaruh di satu tipe, bukan diulang sebagai parameter lepas di tiap service,
 * supaya menambah dimensi penyaring berikutnya (mis. tim atau region) tidak
 * berarti menyunting tiga tanda tangan fungsi yang harus tetap sejalan.
 */
export interface EnvironmentFilter {
  /** Kosongkan untuk seluruh lingkungan. */
  environment?: DeploymentEnvironment
}
