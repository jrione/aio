/**
 * Halaman detail deployment (route `/deployments/:id`).
 *
 * Satu request, bukan tiga: ringkasan, log, dan riwayat datang bersama dalam
 * satu `DeploymentDetail`. Memisahkannya jadi tiga endpoint berarti tiga
 * keadaan memuat yang muncul bergantian, tiga cara gagal sebagian, dan halaman
 * yang tersusun perlahan di depan mata pengguna. Alasannya ditulis lengkap di
 * `deployment.types.ts`.
 *
 * Tautan "Kembali" sengaja `<Link>` biasa ke daftar, bukan `navigate(-1)`.
 * Riwayat browser bisa berasal dari mana saja — tautan yang dibagikan, tab
 * baru, muat ulang — dan tombol kembali yang kadang keluar dari aplikasi lebih
 * buruk daripada tautan yang selalu menuju tempat yang sama. Penyaring yang
 * sedang berlaku tetap tersimpan di URL daftar, jadi kembali ke sana tidak
 * kehilangan apa pun.
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { QueryState } from '@/components/QueryState.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { Icon } from '@/components/Icon.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Table, type TableColumn } from '@/components/ui/Table.tsx'
import { Tabs } from '@/components/ui/Tabs.tsx'
import { Badge } from '@/components/ui/Badge.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { DeploymentActions } from '@/features/deployments/DeploymentActions.tsx'
import { DeploymentLog } from '@/features/deployments/DeploymentLog.tsx'
import { DeploymentSummary } from '@/features/deployments/DeploymentSummary.tsx'
import { DEPLOYMENT_STATUS_LABEL, DEPLOYMENT_STATUS_TONE } from '@/features/deployments/labels.ts'
import { NewDeploymentDialog } from '@/features/deployments/NewDeploymentDialog.tsx'
import { formatAgo, formatDuration } from '@/features/formatters.ts'
import { buildPath } from '@/routes/build-path.ts'
import { ROUTES } from '@/routes/routes.ts'
import { useDeployment } from '@/services/deployments/deployment.queries.ts'
import type { Deployment, NewDeployment } from '@/services/deployments/deployment.types.ts'

const HISTORY_COLUMNS: TableColumn<Deployment>[] = [
  {
    key: 'version',
    header: 'Versi',
    render: (row) => (
      <Link
        to={buildPath(ROUTES.deploymentDetail, { id: row.id })}
        className="font-mono text-xs font-medium text-content hover:text-brand-600 hover:underline"
      >
        {row.version}
      </Link>
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

export default function DeploymentDetailPage() {
  // Route-nya `/deployments/:id`, jadi `id` selalu ada saat halaman ini
  // dirender. Default `''` menjaga tipenya tetap `string` tanpa `as`, dan
  // kalaupun sampai kosong, server menjawab 404 dan tampilan gagal yang muncul.
  const { id = '' } = useParams()
  const detail = useDeployment(id)

  const [tab, setTab] = useState('log')
  const [rerun, setRerun] = useState<Partial<NewDeployment> | undefined>(undefined)

  return (
    <div className="flex flex-col gap-6">
      <Link
        to={ROUTES.deployments}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content"
      >
        <Icon name="arrow-left-icon" className="size-4" />
        Kembali ke daftar deployment
      </Link>

      <QueryState
        query={detail}
        errorTitle="Gagal memuat deployment"
        loading={
          <div className="flex w-full flex-col gap-6">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
      >
        {(data) => (
          <div className="flex flex-col gap-6">
            <DeploymentSummary deployment={data} />

            <DeploymentActions
              deployment={data}
              onRerun={() => {
                setRerun({
                  service: data.service,
                  environment: data.environment,
                  version: data.version,
                })
              }}
            />

            <Tabs
              label="Detail deployment"
              value={tab}
              onChange={setTab}
              items={[
                {
                  id: 'log',
                  label: 'Log',
                  content: <DeploymentLog lines={data.log} />,
                },
                {
                  id: 'riwayat',
                  label: 'Riwayat',
                  content:
                    data.history.length === 0 ? (
                      <Card bodyClassName="p-0">
                        <EmptyState
                          icon="deployment-icon"
                          title="Belum ada rilis sebelumnya"
                          description={`Ini deployment pertama ${data.service} di lingkungan ini.`}
                        />
                      </Card>
                    ) : (
                      <Card bodyClassName="p-0">
                        <Table
                          columns={HISTORY_COLUMNS}
                          rows={data.history}
                          rowKey={(row) => row.id}
                        />
                      </Card>
                    ),
                },
              ]}
            />
          </div>
        )}
      </QueryState>

      {rerun && (
        <NewDeploymentDialog
          initial={rerun}
          onClose={() => {
            setRerun(undefined)
          }}
        />
      )}
    </div>
  )
}
