/**
 * Halaman dashboard (route `/`).
 *
 * Sejak Issue #8 seluruh isinya datang dari lapisan data, bukan dari konstanta
 * di file ini. Halaman ini juga jadi bukti berjalannya acceptance criteria
 * Issue #8: metrik dan tabel aktivitas masing-masing melewati `<QueryState>`,
 * jadi keempat keadaan — memuat, gagal, kosong, berisi — sudah tertangani
 * tanpa satu pun `if` ditulis di sini.
 *
 * Tidak ada `fetch`, tidak ada URL, tidak ada nama parameter query di halaman
 * ini. Semua lewat hook domain. Mengganti `VITE_USE_MOCK` tidak menyentuh satu
 * baris pun di file ini.
 */
import { useState } from 'react'

import { QueryState } from '@/components/QueryState.tsx'
import { Badge } from '@/components/ui/Badge.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { Pagination } from '@/components/ui/Pagination.tsx'
import { Table, type TableColumn } from '@/components/ui/Table.tsx'
import { useActivities, useDashboardSummary } from '@/services/dashboard/dashboard.queries.ts'
import type { Activity, ActivityStatus, MetricTone } from '@/services/dashboard/dashboard.types.ts'

/** Status dari API bernama Inggris; labelnya untuk pengguna berbahasa Indonesia. */
const STATUS_LABEL: Record<ActivityStatus, string> = {
  success: 'Berhasil',
  failed: 'Gagal',
  running: 'Berjalan',
}

const STATUS_TONE: Record<ActivityStatus, MetricTone> = {
  success: 'success',
  failed: 'danger',
  running: 'info',
}

const KIND_LABEL: Record<Activity['kind'], string> = {
  deployment: 'Deployment',
  pipeline: 'Pipeline',
  incident: 'Insiden',
}

const relativeTime = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
const numberFormat = new Intl.NumberFormat('id-ID')

/** `2024-…T10:00:00Z` → `3 menit yang lalu`. */
const formatAgo = (iso: string): string => {
  const minutes = Math.round((Date.parse(iso) - Date.now()) / 60_000)
  if (Math.abs(minutes) < 60) return relativeTime.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relativeTime.format(hours, 'hour')
  return relativeTime.format(Math.round(hours / 24), 'day')
}

const COLUMNS: TableColumn<Activity>[] = [
  {
    key: 'target',
    header: 'Target',
    render: (row) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-content">{row.target}</p>
        <p className="text-xs text-content-muted">{KIND_LABEL[row.kind]}</p>
      </div>
    ),
  },
  {
    key: 'environment',
    header: 'Lingkungan',
    className: 'font-mono text-xs',
    render: (row) => row.environment,
  },
  { key: 'actor', header: 'Oleh', render: (row) => row.actor },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <Badge tone={STATUS_TONE[row.status]} dot>
        {STATUS_LABEL[row.status]}
      </Badge>
    ),
  },
  {
    key: 'at',
    header: 'Waktu',
    align: 'right',
    className: 'whitespace-nowrap text-content-muted',
    render: (row) => formatAgo(row.at),
  },
]

export default function DashboardPage() {
  const [page, setPage] = useState(1)

  const summary = useDashboardSummary()
  const activities = useActivities({ page })

  return (
    <div className="flex flex-col gap-6">
      {/* Judul halaman sudah ditampilkan AppHeader dari ROUTE_TABLE, jadi
          halaman tidak mengulanginya sebagai <h1> kedua. */}

      <QueryState query={summary} errorTitle="Gagal memuat ringkasan">
        {(data) => (
          <div className="flex flex-col gap-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

      <Card
        title="Aktivitas terbaru"
        description="Deployment, pipeline, dan insiden lintas lingkungan."
        bodyClassName="p-0"
        footer={
          activities.data && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span>
                {numberFormat.format(activities.data.total)} aktivitas, halaman{' '}
                {numberFormat.format(activities.data.page)} dari{' '}
                {numberFormat.format(activities.data.pageCount)}
              </span>
              <Pagination
                page={activities.data.page}
                pageCount={activities.data.pageCount}
                onChange={setPage}
              />
            </div>
          )
        }
      >
        <QueryState
          query={activities}
          errorTitle="Gagal memuat aktivitas"
          isEmpty={(data) => data.items.length === 0}
          empty={
            <EmptyState
              title="Belum ada aktivitas"
              description="Deployment dan pipeline yang berjalan akan muncul di sini."
            />
          }
        >
          {(data) => <Table columns={COLUMNS} rows={data.items} rowKey={(row) => row.id} />}
        </QueryState>
      </Card>
    </div>
  )
}
