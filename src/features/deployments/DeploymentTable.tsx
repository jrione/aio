/**
 * Tabel daftar deployment.
 *
 * Kolomnya dideklarasikan sebagai data (`COLUMNS`), bukan `<td>` yang diketik
 * ulang — lihat catatan di `src/components/ui/Table.tsx`.
 *
 * Yang menyalurkan pengguna ke halaman detail adalah tautan di kolom pertama,
 * bukan `onClick` pada seluruh baris. Baris yang bisa diklik tidak bisa
 * difokus keyboard, tidak muncul di daftar tautan screen reader, dan tidak bisa
 * dibuka di tab baru — tiga hal yang didapat `<Link>` tanpa diminta.
 */
import { Link } from 'react-router'

import { QueryState } from '@/components/QueryState.tsx'
import { Badge } from '@/components/ui/Badge.tsx'
import { Button } from '@/components/ui/Button.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { Pagination } from '@/components/ui/Pagination.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table, type TableColumn } from '@/components/ui/Table.tsx'
import { isFiltered } from '@/features/deployments/deployment-filter.ts'
import { DEPLOYMENT_STATUS_LABEL, DEPLOYMENT_STATUS_TONE } from '@/features/deployments/labels.ts'
import {
  ENVIRONMENT_LABEL,
  formatAgo,
  formatDuration,
  numberFormat,
} from '@/features/formatters.ts'
import { buildPath } from '@/routes/build-path.ts'
import { ROUTES } from '@/routes/routes.ts'
import { useDeployments } from '@/services/deployments/deployment.queries.ts'
import type { Deployment, DeploymentFilter } from '@/services/deployments/deployment.types.ts'

const COLUMNS: TableColumn<Deployment>[] = [
  {
    key: 'service',
    header: 'Layanan',
    render: (row) => (
      <div className="min-w-0">
        <Link
          to={buildPath(ROUTES.deploymentDetail, { id: row.id })}
          className="truncate font-medium text-content hover:text-brand-600 hover:underline"
        >
          {row.service}
        </Link>
        <p className="truncate font-mono text-xs text-content-muted">{row.branch}</p>
      </div>
    ),
  },
  {
    key: 'environment',
    header: 'Lingkungan',
    className: 'whitespace-nowrap',
    render: (row) => ENVIRONMENT_LABEL[row.environment],
  },
  {
    key: 'version',
    header: 'Versi',
    className: 'whitespace-nowrap',
    render: (row) => (
      <div>
        <p className="font-mono text-xs text-content">{row.version}</p>
        <p className="font-mono text-xs text-content-muted">{row.commit}</p>
      </div>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <Badge tone={DEPLOYMENT_STATUS_TONE[row.status]} dot>
        {DEPLOYMENT_STATUS_LABEL[row.status]}
      </Badge>
    ),
  },
  {
    key: 'triggeredBy',
    header: 'Pemicu',
    className: 'font-mono text-xs whitespace-nowrap',
    render: (row) => row.triggeredBy,
  },
  {
    key: 'duration',
    header: 'Durasi',
    align: 'right',
    className: 'whitespace-nowrap tabular-nums',
    render: (row) => formatDuration(row.durationMs),
  },
  {
    key: 'startedAt',
    header: 'Mulai',
    align: 'right',
    className: 'whitespace-nowrap text-content-muted',
    render: (row) => formatAgo(row.startedAt),
  },
]

const SKELETON_ROWS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

export interface DeploymentTableProps {
  filter: DeploymentFilter
  onPageChange: (page: number) => void
  onReset: () => void
}

export function DeploymentTable({ filter, onPageChange, onReset }: DeploymentTableProps) {
  const deployments = useDeployments(filter)

  return (
    <Card
      bodyClassName="p-0"
      footer={
        deployments.data && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {numberFormat.format(deployments.data.total)} deployment, halaman{' '}
              {numberFormat.format(deployments.data.page)} dari{' '}
              {numberFormat.format(deployments.data.pageCount)}
            </span>
            <Pagination
              page={deployments.data.page}
              pageCount={deployments.data.pageCount}
              onChange={onPageChange}
            />
          </div>
        )
      }
    >
      <QueryState
        query={deployments}
        errorTitle="Gagal memuat daftar deployment"
        isEmpty={(data) => data.items.length === 0}
        /*
         * Dua keadaan kosong yang berbeda, bukan satu.
         *
         * "Tidak ada hasil" dan "belum ada apa-apa" menuntut tindakan yang
         * berlawanan: yang pertama minta penyaringnya dilonggarkan, yang kedua
         * minta sesuatu dijalankan. Satu kalimat untuk keduanya pasti salah di
         * salah satunya.
         */
        empty={
          isFiltered(filter) ? (
            <EmptyState
              icon="search-icon"
              title="Tidak ada yang cocok"
              description="Tidak ada deployment yang cocok dengan penyaring saat ini."
              action={
                <Button size="sm" variant="secondary" onClick={onReset}>
                  Reset penyaring
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="deployment-icon"
              title="Belum ada deployment"
              description="Begitu ada rilis yang dijalankan, riwayatnya muncul di sini."
            />
          )
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
