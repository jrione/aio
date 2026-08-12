/**
 * Halaman settings (route `/settings`), terproteksi.
 *
 * Isi sungguhan (profil, preferensi, tema) dibangun di Issue #13. Untuk
 * sekarang menampilkan konfigurasi environment yang sedang aktif — sekaligus
 * jadi contoh `Card` + `Table` dengan kolom yang dideklarasikan sebagai data.
 */
import { Badge } from '@/components/ui/Badge.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { Table, type TableColumn } from '@/components/ui/Table.tsx'
import { env } from '@/config/env.ts'

interface Setting {
  key: string
  label: string
  value: string
}

const SETTINGS: Setting[] = [
  { key: 'appName', label: 'Aplikasi', value: env.appName },
  { key: 'appEnv', label: 'Lingkungan', value: env.appEnv },
  { key: 'apiBaseUrl', label: 'Base URL API', value: env.apiBaseUrl },
  { key: 'apiTimeout', label: 'Timeout request', value: `${String(env.apiTimeout)} ms` },
]

const COLUMNS: TableColumn<Setting>[] = [
  { key: 'label', header: 'Pengaturan', render: (row) => row.label },
  {
    key: 'value',
    header: 'Nilai',
    align: 'right',
    className: 'font-mono text-xs',
    render: (row) => row.value,
  },
]

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Judul halaman datang dari AppHeader — lihat catatan di DashboardPage. */}
      <p className="text-content-muted">
        Pengaturan sungguhan menyusul di Issue #13. Sementara ini menampilkan konfigurasi
        environment yang sedang aktif.
      </p>

      <Card
        title="Konfigurasi environment"
        description="Diturunkan dari env.defaults.ts, hanya-baca."
        actions={
          <Badge tone={env.useMock ? 'warning' : 'success'} dot>
            {env.useMock ? 'mode mock' : 'API asli'}
          </Badge>
        }
        bodyClassName="p-0"
      >
        <Table columns={COLUMNS} rows={SETTINGS} rowKey={(row) => row.key} />
      </Card>
    </div>
  )
}
