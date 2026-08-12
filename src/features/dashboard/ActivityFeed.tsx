/**
 * Tabel aktivitas terbaru, dengan penyaring status dan halaman.
 *
 * Kolomnya dideklarasikan sebagai data (`COLUMNS`), bukan sebagai `<td>` yang
 * diketik ulang — lihat catatan di `src/components/ui/Table.tsx`.
 */
import { useState } from 'react'

import { QueryState } from '@/components/QueryState.tsx'
import { Badge } from '@/components/ui/Badge.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { Pagination } from '@/components/ui/Pagination.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table, type TableColumn } from '@/components/ui/Table.tsx'
import {
  ENVIRONMENT_LABEL,
  formatAgo,
  KIND_LABEL,
  numberFormat,
  STATUS_LABEL,
  STATUS_TONE,
} from '@/features/dashboard/formatters.ts'
import { useActivities } from '@/services/dashboard/dashboard.queries.ts'
import type {
  Activity,
  ActivityStatus,
  DashboardFilter,
} from '@/services/dashboard/dashboard.types.ts'

/** `''` berarti "semua status" — nilai kosong yang sah untuk sebuah `<option>`. */
const STATUS_OPTIONS = [
  { value: '', label: 'Semua status' },
  { value: 'success', label: STATUS_LABEL.success },
  { value: 'failed', label: STATUS_LABEL.failed },
  { value: 'running', label: STATUS_LABEL.running },
] as const

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
    className: 'whitespace-nowrap',
    render: (row) => ENVIRONMENT_LABEL[row.environment],
  },
  { key: 'actor', header: 'Oleh', className: 'font-mono text-xs', render: (row) => row.actor },
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

const SKELETON_ROWS = ['a', 'b', 'c', 'd', 'e']

export function ActivityFeed({ filter }: { filter: DashboardFilter }) {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<ActivityStatus | undefined>(undefined)

  /*
   * Mengganti lingkungan mengembalikan tabel ke halaman pertama.
   *
   * Disetel saat render, bukan lewat `useEffect`. Efek berjalan **setelah**
   * layar dilukis, jadi pengguna sempat melihat "halaman 4 dari 1" berkedip
   * sebelum terkoreksi. Pola ini yang dianjurkan React untuk menyesuaikan state
   * terhadap perubahan props: React membuang render yang tanggung dan langsung
   * mengulanginya dengan nilai yang benar.
   */
  const [lastEnvironment, setLastEnvironment] = useState(filter.environment)
  if (filter.environment !== lastEnvironment) {
    setLastEnvironment(filter.environment)
    setPage(1)
  }

  const activities = useActivities({ ...filter, page, status })

  return (
    <Card
      title="Aktivitas terbaru"
      description="Deployment, pipeline, dan insiden lintas lingkungan."
      bodyClassName="p-0"
      actions={
        <Select
          id="aktivitas-status"
          size="sm"
          aria-label="Saring menurut status"
          options={STATUS_OPTIONS}
          value={status ?? ''}
          onChange={(event) => {
            const next = STATUS_OPTIONS.find((option) => option.value === event.target.value)
            setStatus(next && next.value !== '' ? next.value : undefined)
            setPage(1)
          }}
          wrapperClassName="w-40"
        />
      }
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
            title="Tidak ada aktivitas"
            description="Belum ada yang cocok dengan penyaring saat ini. Coba lingkungan atau status lain."
          />
        }
        loading={
          <div className="flex flex-col gap-3 p-5">
            {SKELETON_ROWS.map((id) => (
              <Skeleton key={id} className="h-10 w-full" />
            ))}
          </div>
        }
      >
        {(data) => <Table columns={COLUMNS} rows={data.items} rowKey={(row) => row.id} />}
      </QueryState>
    </Card>
  )
}
