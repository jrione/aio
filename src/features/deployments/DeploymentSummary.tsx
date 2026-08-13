/**
 * Ringkasan sebuah deployment: seluruh atribut yang tidak muat di tabel.
 *
 * Dirender sebagai `<dl>`, bukan grid berisi `<div>` berpasangan. Itu bukan
 * kerapian markup: daftar definisi memberi tahu screen reader bahwa "Commit"
 * dan "9c2f50e" adalah pasangan istilah-dan-nilai, sehingga pengguna bisa
 * melompat antar istilah alih-alih mendengarkan tujuh belas potong teks yang
 * hubungannya harus ditebak sendiri.
 *
 * Barisnya dideklarasikan sebagai data, sama seperti kolom tabel — menambah
 * atribut berarti menambah satu entri, bukan menyalin satu blok JSX.
 */
import type { ReactNode } from 'react'

import { Badge } from '@/components/ui/Badge.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { DEPLOYMENT_STATUS_LABEL, DEPLOYMENT_STATUS_TONE } from '@/features/deployments/labels.ts'
import { ENVIRONMENT_LABEL, formatDuration, formatFull } from '@/features/formatters.ts'
import type { Deployment } from '@/services/deployments/deployment.types.ts'

interface Row {
  readonly key: string
  readonly term: string
  readonly render: (deployment: Deployment) => ReactNode
  /** Nilai teknis dirender mono; keterangan biasa tidak. */
  readonly mono?: boolean
}

const ROWS: readonly Row[] = [
  {
    key: 'status',
    term: 'Status',
    render: (deployment) => (
      <Badge tone={DEPLOYMENT_STATUS_TONE[deployment.status]} dot>
        {DEPLOYMENT_STATUS_LABEL[deployment.status]}
      </Badge>
    ),
  },
  {
    key: 'environment',
    term: 'Lingkungan',
    render: (deployment) => ENVIRONMENT_LABEL[deployment.environment],
  },
  { key: 'version', term: 'Versi', render: (deployment) => deployment.version, mono: true },
  { key: 'commit', term: 'Commit', render: (deployment) => deployment.commit, mono: true },
  { key: 'branch', term: 'Branch', render: (deployment) => deployment.branch, mono: true },
  {
    key: 'triggeredBy',
    term: 'Dipicu oleh',
    render: (deployment) => deployment.triggeredBy,
    mono: true,
  },
  {
    key: 'startedAt',
    term: 'Mulai',
    render: (deployment) => (
      <time dateTime={deployment.startedAt}>{formatFull(deployment.startedAt)}</time>
    ),
  },
  {
    key: 'duration',
    term: 'Durasi',
    render: (deployment) =>
      deployment.durationMs === null ? 'Masih berjalan' : formatDuration(deployment.durationMs),
  },
]

export function DeploymentSummary({ deployment }: { deployment: Deployment }) {
  return (
    <Card title={deployment.service} description={`Deployment ${deployment.id}`}>
      <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
        {ROWS.map((row) => (
          <div key={row.key} className="min-w-0">
            <dt className="text-xs tracking-wider text-content-muted uppercase">{row.term}</dt>
            <dd
              className={`mt-1 truncate text-sm text-content ${row.mono === true ? 'font-mono' : ''}`}
            >
              {row.render(deployment)}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
