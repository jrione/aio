/**
 * Halaman dashboard (route `/`).
 *
 * Sejak Issue #11 halaman ini hampir tidak berisi apa-apa selain susunan: tiga
 * widget di `src/features/dashboard/`, masing-masing memanggil hook domainnya
 * sendiri dan menangani keempat keadaannya sendiri. Yang tinggal di sini cuma
 * satu hal yang memang milik halaman — penyaring lingkungan yang berlaku untuk
 * ketiganya sekaligus.
 *
 * Pembagian itu yang menjaga halaman tetap bisa dibaca saat widget bertambah:
 * menambah satu widget berarti menambah satu baris di sini, bukan menambah satu
 * query, satu state loading, satu state error, dan satu state kosong.
 *
 * Tidak ada `fetch`, tidak ada URL, tidak ada nama parameter query di file ini
 * maupun di widget-nya. Semua lewat hook domain — dijaga `npm run check:layers`.
 */
import { useState } from 'react'

import { Select } from '@/components/ui/Select.tsx'
import { ActivityFeed } from '@/features/dashboard/ActivityFeed.tsx'
import { MetricGrid } from '@/features/dashboard/MetricGrid.tsx'
import { TrendChart } from '@/features/dashboard/TrendChart.tsx'
import { ENVIRONMENT_OPTIONS } from '@/features/formatters.ts'
import type { TrendRange } from '@/services/dashboard/dashboard.types.ts'
import type { DeploymentEnvironment } from '@/services/environment.ts'

export default function DashboardPage() {
  const [environment, setEnvironment] = useState<DeploymentEnvironment | undefined>(undefined)
  const [range, setRange] = useState<TrendRange>('24h')

  const filter = { environment }

  return (
    <div className="flex flex-col gap-6">
      {/* Judul halaman sudah ditampilkan AppHeader dari ROUTE_TABLE, jadi
          halaman tidak mengulanginya sebagai <h1> kedua. */}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="text-sm text-content-muted">
          Ringkasan operasional lintas layanan, diperbarui otomatis.
        </p>

        <Select
          id="dashboard-lingkungan"
          size="sm"
          aria-label="Saring seluruh dashboard menurut lingkungan"
          options={ENVIRONMENT_OPTIONS}
          value={environment ?? ''}
          onChange={(event) => {
            const next = ENVIRONMENT_OPTIONS.find((option) => option.value === event.target.value)
            setEnvironment(next && next.value !== '' ? next.value : undefined)
          }}
          wrapperClassName="w-48"
        />
      </div>

      <MetricGrid filter={filter} />
      <TrendChart filter={filter} range={range} onRangeChange={setRange} />
      <ActivityFeed filter={filter} />
    </div>
  )
}
