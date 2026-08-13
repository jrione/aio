/**
 * Halaman pengaturan (route `/settings`).
 *
 * ## Terbuka untuk semua yang sudah masuk
 *
 * Sampai Issue #12, route ini menuntut izin `settings:manage` — dan itu keliru
 * begitu isinya jadi profil dan password. Seorang `viewer` harus selalu bisa
 * mengganti passwordnya sendiri; halaman yang menghalanginya berarti akun yang
 * dicurigai bocor tidak bisa diamankan pemiliknya.
 *
 * Karena itu izinnya dilepas di `ROUTE_TABLE`. Pengaturan tingkat sistem —
 * katalog, pengguna, integrasi — nanti tinggal di route tersendiri dengan
 * `settings:manage`, bukan menumpang di sini.
 *
 * ## Tab hidup di URL
 *
 * `/settings?tab=keamanan` bisa disalin dan dikirim ("ganti passwordmu di sini"),
 * dan tetap terbuka di tab yang sama setelah halaman dimuat ulang. Mekanismenya
 * sama persis dengan penyaring di halaman Deployments — `useUrlState` dengan satu
 * codec, lihat `src/routes/useUrlState.ts`.
 */
import { Tabs } from '@/components/ui/Tabs.tsx'
import { useSession } from '@/features/auth/session.ts'
import { AppearanceCard } from '@/features/settings/AppearanceCard.tsx'
import { NotificationsCard } from '@/features/settings/NotificationsCard.tsx'
import { PasswordCard } from '@/features/settings/PasswordCard.tsx'
import { ProfileCard } from '@/features/settings/ProfileCard.tsx'
import { readOneOf, useUrlState, writeOptional, type UrlCodec } from '@/routes/useUrlState.ts'

const TABS = ['profil', 'keamanan', 'tampilan', 'notifikasi'] as const

type SettingsTab = (typeof TABS)[number]

const DEFAULT_TAB: SettingsTab = 'profil'

const tabCodec: UrlCodec<SettingsTab> = {
  read: (params) => readOneOf(params, 'tab', TABS) ?? DEFAULT_TAB,
  // Tab bawaan tidak ditulis ke URL: `/settings` dan `/settings?tab=profil`
  // menampilkan hal yang sama, dan yang pertama lebih enak dibagikan.
  write: (tab, params) => {
    writeOptional(params, 'tab', tab === DEFAULT_TAB ? undefined : tab)
  },
}

export default function SettingsPage() {
  const [tab, setTab] = useUrlState(tabCodec)
  const { user } = useSession()

  /*
   * Route ini `protected`, jadi guard sudah memastikan ada penggunanya sebelum
   * halaman dirender. Penjagaan ini cuma menutup celah tipe — dan kalaupun
   * sampai kejadian, layar kosong lebih baik daripada halaman yang meledak.
   */
  if (!user) return null

  return (
    <div className="flex flex-col gap-6">
      <p className="max-w-prose text-sm text-content-muted">
        Pengaturan akun dan preferensi Anda. Tab yang sedang terbuka tersimpan di alamat halaman,
        jadi tautannya bisa dibagikan apa adanya.
      </p>

      <Tabs
        label="Bagian pengaturan"
        value={tab}
        onChange={(next) => {
          const matched = TABS.find((candidate) => candidate === next)
          if (matched) setTab(matched)
        }}
        items={[
          { id: 'profil', label: 'Profil', content: <ProfileCard user={user} /> },
          { id: 'keamanan', label: 'Keamanan', content: <PasswordCard /> },
          { id: 'tampilan', label: 'Tampilan', content: <AppearanceCard /> },
          { id: 'notifikasi', label: 'Notifikasi', content: <NotificationsCard /> },
        ]}
      />
    </div>
  )
}
