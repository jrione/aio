/**
 * Deretan kartu metrik di puncak dashboard.
 *
 * Widget ini — seperti dua lainnya — tidak menerima data lewat props melainkan
 * memanggil hook domainnya sendiri. Yang dioper cuma penyaringnya. Akibatnya
 * halaman tidak berubah jadi tempat penampungan tiga query beserta empat
 * keadaan masing-masing, dan memindahkan widget ini ke halaman lain tidak
 * menuntut memindahkan apa pun selain satu baris JSX.
 */
import { QueryState } from '@/components/QueryState.tsx'
import { Badge } from '@/components/ui/Badge.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { formatAgo, numberFormat } from '@/features/dashboard/formatters.ts'
import { useDashboardSummary } from '@/services/dashboard/dashboard.queries.ts'
import type { DashboardFilter } from '@/services/dashboard/dashboard.types.ts'

/** Empat kartu, karena itu jumlah yang akan muncul. */
const PLACEHOLDERS = ['a', 'b', 'c', 'd']

const GRID = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-4'

export function MetricGrid({ filter }: { filter: DashboardFilter }) {
  const summary = useDashboardSummary(filter)

  return (
    <QueryState
      query={summary}
      errorTitle="Gagal memuat ringkasan"
      isEmpty={(data) => data.metrics.length === 0}
      empty={
        <Card>
          <EmptyState
            icon="dashboard-icon"
            title="Belum ada yang bisa diringkas"
            description="Lingkungan ini belum pernah menjalankan deployment atau pipeline."
          />
        </Card>
      }
      loading={
        // Skeleton-nya sengaja seukuran kartu sungguhan: begitu data tiba,
        // tidak ada yang bergeser.
        <div className={GRID}>
          {PLACEHOLDERS.map((id) => (
            <Card key={id}>
              <Skeleton className="h-4 w-28" />
              <div className="mt-3 flex items-center justify-between gap-3">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </Card>
          ))}
        </div>
      }
    >
      {(data) => (
        <div className="flex flex-col gap-3">
          <div className={GRID}>
            {data.metrics.map((metric) => (
              <Card key={metric.id}>
                <p className="text-sm text-content-muted">{metric.label}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="font-display text-3xl font-medium text-content">
                    {numberFormat.format(metric.value)}
                    {metric.unit && (
                      <span className="ml-0.5 text-xl text-content-muted">{metric.unit}</span>
                    )}
                  </span>
                  <Badge tone={metric.tone} dot>
                    {metric.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>

          <p className="text-xs text-content-muted">Diperbarui {formatAgo(data.updatedAt)}.</p>
        </div>
      )}
    </QueryState>
  )
}
