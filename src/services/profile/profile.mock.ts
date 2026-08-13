/**
 * Data tiruan untuk domain profil.
 *
 * Seperti mock deployments, yang ini **menyimpan perubahan** — dan di sini
 * taruhannya lebih tinggi. Mock ganti password yang selalu menjawab "berhasil"
 * membuat dua kesalahan yang paling mungkin terjadi jadi mustahil ditemukan:
 * password lama tidak benar-benar diperiksa, dan password baru tidak benar-benar
 * dipakai. Dengan mock ini, keduanya bisa diperiksa dalam satu putaran: ganti
 * password, keluar, lalu masuk memakai yang baru.
 *
 * Password sendiri tidak pernah menyentuh file ini. Yang tersedia hanyalah dua
 * fungsi dari `auth.mock.ts` — "cocok atau tidak" dan "ganti" — sehingga daftar
 * password tetap terkurung di satu tempat.
 *
 * Preferensi notifikasi disimpan per pengguna, bukan satu untuk semua. Mock yang
 * membagi satu objek preferensi ke seluruh akun akan menyembunyikan kesalahan
 * paling klasik di endpoint semacam ini: lupa menyaring menurut pemiliknya.
 */
import { isMockPassword, setMockPassword, setMockUserName } from '@/services/auth/auth.mock.ts'
import type { MockRoute } from '@/services/mock/mock-transport.ts'
import {
  NOTIFICATION_EVENTS,
  type NotificationEvent,
  type NotificationRule,
  type NotificationSettings,
  type QuietHours,
} from '@/services/profile/profile.types.ts'

/* ─────────────────────────────────────────────────────────────
 * Profil
 * ───────────────────────────────────────────────────────────── */

const NAME_MIN = 2
const NAME_MAX = 60

/** Password minimal; sama dengan yang diperiksa form di browser. */
const PASSWORD_MIN = 8

/*
 * Pembaca per field, bukan satu pembaca generik ber-`key: string`.
 *
 * Bentuk `'name' in source && typeof source.name === 'string'` benar-benar
 * mempersempit tipenya, sehingga tidak ada `as` di mana pun. Versi generik
 * menuntut indeks dinamis, dan indeks dinamis pada `object` selalu berakhir di
 * `any` atau di cast — dua hal yang justru sedang dihindari. Pola yang sama
 * dipakai di `auth.mock.ts` dan `deployment.mock.ts`.
 */
const asObject = (body: unknown): object => (typeof body === 'object' && body !== null ? body : {})

const readName = (body: unknown): string => {
  const source = asObject(body)
  return 'name' in source && typeof source.name === 'string' ? source.name.trim() : ''
}

const readCurrentPassword = (body: unknown): string => {
  const source = asObject(body)
  return 'currentPassword' in source && typeof source.currentPassword === 'string'
    ? source.currentPassword
    : ''
}

const readNewPassword = (body: unknown): string => {
  const source = asObject(body)
  return 'newPassword' in source && typeof source.newPassword === 'string' ? source.newPassword : ''
}

/* ─────────────────────────────────────────────────────────────
 * Preferensi notifikasi
 * ───────────────────────────────────────────────────────────── */

/**
 * Nilai awal yang **tidak** seragam.
 *
 * Kegagalan dikabari lewat dua kanal, keberhasilan hanya di dalam aplikasi.
 * Preferensi bawaan yang semuanya menyala adalah cara tercepat membuat orang
 * mematikan notifikasi seluruhnya — dan setelah itu pemberitahuan yang benar-
 * benar penting ikut tidak sampai.
 */
const defaultSettings = (): NotificationSettings => ({
  rules: NOTIFICATION_EVENTS.map((event) => ({
    event,
    email: event.endsWith('.failed') || event === 'incident.opened',
    inApp: true,
  })),
  quietHours: { enabled: false, from: '22:00', to: '07:00' },
})

/** Preferensi per pengguna. Hilang saat halaman dimuat ulang, seperti mock lain. */
const settingsByUser = new Map<string, NotificationSettings>()

const settingsFor = (userId: string): NotificationSettings => {
  const existing = settingsByUser.get(userId)
  if (existing) return existing
  const created = defaultSettings()
  settingsByUser.set(userId, created)
  return created
}

/** `HH:mm` dengan jam 00–23 dan menit 00–59. */
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

const readQuietHours = (value: unknown, fallback: QuietHours): QuietHours => {
  if (typeof value !== 'object' || value === null) return fallback

  const enabled = 'enabled' in value && value.enabled === true
  const from = 'from' in value && typeof value.from === 'string' ? value.from : fallback.from
  const to = 'to' in value && typeof value.to === 'string' ? value.to : fallback.to

  // Jam yang tidak berbentuk `HH:mm` dijatuhkan ke nilai sebelumnya, bukan
  // ditolak dengan 422: yang mengirimnya adalah `<input type="time">`, jadi
  // bentuk yang salah berarti bug di klien, bukan kesalahan pengguna.
  return {
    enabled,
    from: TIME_PATTERN.test(from) ? from : fallback.from,
    to: TIME_PATTERN.test(to) ? to : fallback.to,
  }
}

const readRules = (value: unknown, fallback: readonly NotificationRule[]): NotificationRule[] => {
  const incoming: readonly unknown[] = Array.isArray(value) ? value : []

  /*
   * Dibangun dari daftar kejadian yang dikenal server, bukan dari yang dikirim
   * klien. Klien yang mengirim kejadian tak dikenal — versi lama, atau iseng —
   * tidak bisa menambah baris ke preferensi orang lain, dan kejadian baru yang
   * belum dikenal klien tetap punya nilai bawaannya.
   */
  return NOTIFICATION_EVENTS.map((event: NotificationEvent): NotificationRule => {
    const previous = fallback.find((rule) => rule.event === event)
    const sent = incoming.find(
      (item): item is { event: string; email?: unknown; inApp?: unknown } =>
        typeof item === 'object' && item !== null && 'event' in item && item.event === event,
    )
    if (!sent) return previous ?? { event, email: false, inApp: false }
    return { event, email: sent.email === true, inApp: sent.inApp === true }
  })
}

/* ─────────────────────────────────────────────────────────────
 * Route
 * ───────────────────────────────────────────────────────────── */

export const profileMockRoutes: readonly MockRoute[] = [
  {
    method: 'PATCH',
    path: '/profile',
    handle: ({ body, user }) => {
      if (!user) return { status: 401, body: { message: 'Sesi sudah berakhir.' } }

      const name = readName(body)
      if (name.length < NAME_MIN) {
        return { status: 422, body: { errors: { name: 'Nama minimal 2 karakter.' } } }
      }
      if (name.length > NAME_MAX) {
        return { status: 422, body: { errors: { name: 'Nama maksimal 60 karakter.' } } }
      }

      const updated = setMockUserName(user.id, name)
      if (!updated) return { status: 404, body: { message: 'Akun tidak ditemukan.' } }
      return { body: updated }
    },
  },

  {
    method: 'PUT',
    path: '/profile/password',
    handle: ({ body, user }) => {
      if (!user) return { status: 401, body: { message: 'Sesi sudah berakhir.' } }

      const currentPassword = readCurrentPassword(body)
      const newPassword = readNewPassword(body)

      /*
       * Password lama diperiksa server, bukan hanya di browser — dan bukan
       * karena aturannya rumit. Tanpa pemeriksaan ini, siapa pun yang menemukan
       * laptop tak terkunci bisa mengambil alih akunnya tanpa tahu password
       * lamanya.
       */
      if (!isMockPassword(user.id, currentPassword)) {
        return { status: 422, body: { errors: { currentPassword: 'Password saat ini salah.' } } }
      }
      if (newPassword.length < PASSWORD_MIN) {
        return {
          status: 422,
          body: { errors: { newPassword: 'Password baru minimal 8 karakter.' } },
        }
      }
      if (newPassword === currentPassword) {
        return {
          status: 422,
          body: { errors: { newPassword: 'Password baru harus berbeda dari yang sekarang.' } },
        }
      }

      setMockPassword(user.id, newPassword)
      return { status: 204 }
    },
  },

  {
    method: 'GET',
    path: '/profile/notifications',
    handle: ({ user }) => {
      if (!user) return { status: 401, body: { message: 'Sesi sudah berakhir.' } }
      return { body: settingsFor(user.id) }
    },
  },

  {
    method: 'PUT',
    path: '/profile/notifications',
    handle: ({ body, user }) => {
      if (!user) return { status: 401, body: { message: 'Sesi sudah berakhir.' } }

      const current = settingsFor(user.id)
      const source: object = typeof body === 'object' && body !== null ? body : {}

      const next: NotificationSettings = {
        rules: readRules('rules' in source ? source.rules : undefined, current.rules),
        quietHours: readQuietHours(
          'quietHours' in source ? source.quietHours : undefined,
          current.quietHours,
        ),
      }

      settingsByUser.set(user.id, next)
      return { body: next }
    },
  },
]
