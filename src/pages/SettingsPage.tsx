/**
 * Halaman settings (route `/settings`), terproteksi.
 *
 * Isi sungguhan (profil, preferensi, tema) dibangun di Issue #13. Untuk
 * sekarang cukup jadi tujuan kedua supaya navigasi antar halaman dalam satu
 * layout bisa diuji.
 */
import { env } from '@/config/env.ts'

const DETAILS = [
  { label: 'Aplikasi', value: env.appName },
  { label: 'Lingkungan', value: env.appEnv },
  { label: 'Base URL API', value: env.apiBaseUrl },
  { label: 'Mode mock', value: env.useMock ? 'aktif' : 'nonaktif' },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Judul halaman datang dari AppHeader — lihat catatan di DashboardPage. */}
      <p className="text-content-muted">
        Pengaturan sungguhan menyusul di Issue #13. Sementara ini menampilkan konfigurasi
        environment yang sedang aktif.
      </p>

      <dl className="divide-y divide-edge rounded-xl border border-edge bg-surface-raised">
        {DETAILS.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 px-6 py-4">
            <dt className="text-sm text-content-muted">{label}</dt>
            <dd className="font-mono text-sm text-content">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
