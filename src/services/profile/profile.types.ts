/**
 * Kontrak data untuk profil pengguna dan preferensinya (Issue #13).
 *
 * Tiga hal yang di UI tampak berdekatan, tapi tempat tinggalnya sangat berbeda —
 * dan perbedaan itu yang menentukan bentuk file ini:
 *
 *   1. **Profil** milik server. Nama pengguna ikut muncul di riwayat deployment
 *      dan nanti di audit log, jadi ia harus sama di semua perangkat.
 *   2. **Password** milik server, dan tidak pernah dibaca kembali — hanya
 *      dikirim, tidak pernah diterima.
 *   3. **Preferensi tampilan** (tema, sidebar) milik perangkat, bukan akun.
 *      Karena itu ia tidak ada di file ini sama sekali; tempatnya `src/store/`.
 *
 * Nomor 3 sering jadi keputusan yang diambil tanpa disadari. Menyimpan tema di
 * server terdengar lebih rapi sampai seseorang memakai laptop terang di kantor
 * dan ponsel gelap di malam hari — lalu preferensi yang "tersinkron" justru jadi
 * gangguan yang tidak bisa dimatikan.
 */

/** Yang boleh diubah pengguna tentang dirinya sendiri. */
export interface ProfileUpdate {
  readonly name: string
}

/**
 * Email dan peran sengaja tidak ada di sini.
 *
 * Keduanya milik penyedia identitas, bukan milik aplikasi ini — dan begitu
 * Keycloak terpasang, mengubahnya dari halaman ini akan berarti menulis balik ke
 * sumber kebenaran orang lain. Halaman profil menampilkannya, tapi hanya-baca.
 */
export interface PasswordChange {
  readonly currentPassword: string
  readonly newPassword: string
}

/** Kejadian yang bisa memicu notifikasi. */
export type NotificationEvent =
  'deployment.failed' | 'deployment.succeeded' | 'pipeline.failed' | 'incident.opened'

export const NOTIFICATION_EVENTS = [
  'deployment.failed',
  'deployment.succeeded',
  'pipeline.failed',
  'incident.opened',
] as const satisfies readonly NotificationEvent[]

/** Satu baris matriks preferensi: satu kejadian, dua kanal. */
export interface NotificationRule {
  readonly event: NotificationEvent
  readonly email: boolean
  readonly inApp: boolean
}

/**
 * Jam tenang: rentang waktu yang tidak dikirimi notifikasi.
 *
 * `from` dan `to` berupa `HH:mm` waktu lokal pengguna. Rentang yang melewati
 * tengah malam (22:00–07:00) sah dan justru yang paling sering dipakai, jadi
 * pembandingnya tidak boleh berasumsi `from < to`.
 */
export interface QuietHours {
  readonly enabled: boolean
  readonly from: string
  readonly to: string
}

export interface NotificationSettings {
  readonly rules: readonly NotificationRule[]
  readonly quietHours: QuietHours
}
