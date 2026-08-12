/**
 * Halaman dashboard (route `/`).
 *
 * Isinya masih sementara — widget sungguhan dibangun di Issue #11. Yang ada
 * sekarang cukup untuk menunjukkan kartu, badge, dan keadaan kosong berdiri di
 * atas design token yang sama.
 */
import { Link } from 'react-router'

import { Badge } from '@/components/ui/Badge.tsx'
import { buttonVariants } from '@/components/ui/button-variants.ts'
import { Card } from '@/components/ui/Card.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { ROUTES } from '@/routes/routes.ts'

interface Stat {
  id: string
  label: string
  value: string
  tone: 'success' | 'warning' | 'danger' | 'info'
  status: string
}

const STATS: Stat[] = [
  {
    id: 'deployments',
    label: 'Deployment hari ini',
    value: '12',
    tone: 'success',
    status: 'sehat',
  },
  { id: 'pipelines', label: 'Pipeline berjalan', value: '3', tone: 'info', status: 'berjalan' },
  { id: 'incidents', label: 'Insiden terbuka', value: '1', tone: 'warning', status: 'perlu cek' },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Judul halaman sudah ditampilkan AppHeader dari ROUTE_TABLE, jadi
          halaman tidak mengulanginya sebagai <h1> kedua. */}
      <p className="text-content-muted">
        Angka di bawah masih contoh. Widget yang membaca data sungguhan dibangun di Issue #11,
        setelah lapisan API di Issue #8 siap.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {STATS.map((stat) => (
          <Card key={stat.id}>
            <p className="text-sm text-content-muted">{stat.label}</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="font-display text-3xl font-medium text-content">{stat.value}</span>
              <Badge tone={stat.tone} dot>
                {stat.status}
              </Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Aktivitas terbaru" bodyClassName="p-0">
        <EmptyState
          title="Belum ada aktivitas"
          description="Riwayat deployment dan pipeline muncul di sini begitu lapisan API tersambung."
          action={
            <Link
              to={ROUTES.settings}
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              Lihat konfigurasi
            </Link>
          }
        />
      </Card>
    </div>
  )
}
