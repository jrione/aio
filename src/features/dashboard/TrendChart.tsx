/**
 * Grafik tren deployment: berhasil vs gagal sepanjang rentang yang dipilih.
 *
 * ## Kenapa Recharts, dan bagaimana ia diwarnai
 *
 * Recharts menggambar SVG lewat komponen React, jadi grafiknya bisa diwarnai
 * dengan **utility class Tailwind yang sama** dengan sisa aplikasi — bukan
 * dengan nilai warna yang diketik ulang di sini. Itu penting untuk tema:
 * `stroke-success` menghasilkan `stroke: var(--color-success)`, dan variabel
 * itu ikut berubah saat pengguna berpindah ke tema gelap. Library berbasis
 * canvas tidak bisa begitu — warnanya harus dibaca dari JavaScript lalu
 * digambar ulang setiap kali temanya berganti.
 *
 * Kelas dipakai alih-alih atribut `stroke="…"` karena aturan CSS mengalahkan
 * atribut presentasi. Recharts tetap memasang warna bawaannya sebagai atribut;
 * kelas Tailwind yang menang tanpa perlu menonaktifkan apa pun.
 *
 * ## Ukuran
 *
 * Recharts adalah dependency terbesar di aplikasi ini. Halaman dashboard
 * di-load lewat `lazy()`, jadi seluruh biayanya jatuh ke chunk dashboard dan
 * tidak ditanggung pengguna yang cuma membuka halaman login.
 */
import { useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { QueryState } from '@/components/QueryState.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { EmptyState } from '@/components/ui/EmptyState.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { formatBucket } from '@/features/dashboard/formatters.ts'
import { formatFull, numberFormat } from '@/features/formatters.ts'
import { useDeploymentTrend } from '@/services/dashboard/dashboard.queries.ts'
import type {
  DeploymentTrend,
  TrendPoint,
  TrendRange,
} from '@/services/dashboard/dashboard.types.ts'
import type { EnvironmentFilter } from '@/services/environment.ts'
import { cn } from '@/utils/cn.ts'

const RANGE_OPTIONS = [
  { value: '24h', label: '24 jam terakhir' },
  { value: '7d', label: '7 hari terakhir' },
  { value: '30d', label: '30 hari terakhir' },
] as const satisfies readonly { value: TrendRange; label: string }[]

/**
 * Kelas diarahkan ke elemen di **dalam** grup, bukan ke grupnya.
 *
 * `className` pada `<Area>` mendarat di elemen `<g class="recharts-area">`,
 * sedangkan warna dipasang Recharts sebagai atribut `stroke`/`fill` di `<path>`
 * di dalamnya. Kelas pada induk tidak mengalahkan atribut pada anak — grafiknya
 * tetap berwarna biru bawaan Recharts, dan itu tidak terlihat sebagai kesalahan
 * karena hasilnya tetap "sebuah grafik berwarna".
 *
 * Varian `[&_.recharts-area-curve]:` menghasilkan aturan CSS yang menyasar
 * `<path>`-nya langsung, dan aturan CSS selalu mengalahkan atribut presentasi.
 */
const SERIES = [
  {
    key: 'succeeded',
    label: 'Berhasil',
    dot: 'bg-success',
    className:
      '[&_.recharts-area-curve]:stroke-success [&_.recharts-area-area]:fill-success/20 [&_.recharts-area-area]:stroke-none',
    activeDotClassName: 'fill-success stroke-none',
  },
  {
    key: 'failed',
    label: 'Gagal',
    dot: 'bg-danger',
    className:
      '[&_.recharts-area-curve]:stroke-danger [&_.recharts-area-area]:fill-danger/20 [&_.recharts-area-area]:stroke-none',
    activeDotClassName: 'fill-danger stroke-none',
  },
] as const

/** Titik yang sedang ditunjuk kursor, sebagaimana dioper Recharts ke tooltip. */
interface TooltipEntry {
  dataKey?: string | number
  value?: number | string | readonly (number | string)[]
}

interface TrendTooltipProps {
  active?: boolean
  label?: string | number
  payload?: readonly TooltipEntry[]
}

/**
 * Tooltip bawaan Recharts memakai style inline berlatar putih, jadi ia menjadi
 * kotak terang menyilaukan di tema gelap. Menggantinya dengan komponen sendiri
 * lebih murah daripada menambal style-nya, dan hasilnya memakai token yang
 * sama dengan kartu di sekitarnya.
 */
function TrendTooltip({ active, label, payload }: TrendTooltipProps) {
  if (active !== true || !payload || payload.length === 0) return null

  return (
    <div className="rounded-lg border border-edge bg-surface-raised px-3 py-2 text-xs shadow-lg">
      <p className="font-medium text-content">
        {typeof label === 'string' ? formatFull(label) : ''}
      </p>
      <ul className="mt-1 flex flex-col gap-0.5">
        {SERIES.map((series) => {
          const entry = payload.find((item) => item.dataKey === series.key)
          if (!entry) return null
          return (
            <li key={series.key} className="flex items-center justify-between gap-4 text-content">
              <span className="text-content-muted">{series.label}</span>
              <span className="font-medium">
                {numberFormat.format(typeof entry.value === 'number' ? entry.value : 0)}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/**
 * Ringkasan angka untuk pembaca yang tidak bisa melihat grafiknya.
 *
 * Sebuah `<svg>` penuh garis tidak menyampaikan apa pun lewat screen reader.
 * Ini bukan tempelan formalitas: kalimatnya berisi jawaban yang sebenarnya
 * dicari orang saat melirik grafik — berapa totalnya, dan kapan paling parah.
 */
function TrendSummary({ trend }: { trend: DeploymentTrend }) {
  const succeeded = trend.points.reduce((total, point) => total + point.succeeded, 0)
  const failed = trend.points.reduce((total, point) => total + point.failed, 0)
  const worst = trend.points.reduce<TrendPoint | undefined>(
    (worstSoFar, point) => (point.failed > (worstSoFar?.failed ?? 0) ? point : worstSoFar),
    undefined,
  )

  return (
    <p className="sr-only">
      Sepanjang rentang ini ada {numberFormat.format(succeeded)} deployment berhasil dan{' '}
      {numberFormat.format(failed)} gagal.
      {worst && ` Kegagalan terbanyak terjadi pada ${formatFull(worst.at)}.`}
    </p>
  )
}

interface TrendChartProps {
  filter: EnvironmentFilter
  range: TrendRange
  onRangeChange: (range: TrendRange) => void
}

export function TrendChart({ filter, range, onRangeChange }: TrendChartProps) {
  const trend = useDeploymentTrend({ ...filter, range })

  return (
    <Card
      title="Tren deployment"
      description="Jumlah deployment yang berhasil dan gagal per satuan waktu."
      actions={
        <Select
          id="tren-rentang"
          size="sm"
          aria-label="Rentang waktu grafik"
          options={RANGE_OPTIONS}
          value={range}
          onChange={(event) => {
            // Nilai `<select>` bertipe string biasa. Mencocokkannya kembali ke
            // daftar pilihan lebih jujur daripada memaksakannya jadi
            // `TrendRange` lewat cast — dan gratis, karena daftarnya ada di
            // sini juga.
            const next = RANGE_OPTIONS.find((option) => option.value === event.target.value)
            if (next) onRangeChange(next.value)
          }}
          wrapperClassName="w-44"
        />
      }
    >
      <QueryState
        query={trend}
        errorTitle="Gagal memuat tren"
        isEmpty={(data) => data.points.length === 0}
        empty={
          <EmptyState
            icon="dashboard-icon"
            title="Belum ada deployment"
            description="Grafik akan terisi begitu ada deployment yang berjalan di lingkungan ini."
          />
        }
        loading={<Skeleton className="h-72 w-full" />}
      >
        {(data) => <TrendBody trend={data} />}
      </QueryState>
    </Card>
  )
}

function TrendBody({ trend }: { trend: DeploymentTrend }) {
  // Recharts membandingkan `data` secara referensi untuk memutuskan animasi;
  // membangun array baru tiap render membuatnya menganimasi ulang tanpa alasan.
  const data = useMemo(() => trend.points.map((point) => ({ ...point })), [trend.points])

  return (
    <div className="flex flex-col gap-4">
      <TrendSummary trend={trend} />

      {/* Tinggi ditetapkan di pembungkus, bukan di grafik: ResponsiveContainer
          mengukur induknya, dan induk setinggi `auto` membuatnya mengukur nol
          lalu tidak menggambar apa pun. */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            {/* Beda dari `<Area>`: `className` di sini mendarat langsung di
                tiap `<line>`, jadi kelasnya ditulis polos. */}
            <CartesianGrid vertical={false} className="stroke-edge" />

            <XAxis
              dataKey="at"
              tickFormatter={(value: string) => formatBucket(value, trend.bucket)}
              tick={{ className: 'fill-content-muted text-[11px]' }}
              tickLine={false}
              axisLine={false}
              // Di layar sempit label tidak dipaksa muat semua; Recharts
              // membuang yang berdesakan alih-alih menumpuknya jadi bubur.
              minTickGap={28}
            />
            <YAxis
              width={36}
              allowDecimals={false}
              tick={{ className: 'fill-content-muted text-[11px]' }}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip content={<TrendTooltip />} cursor={{ className: 'stroke-edge' }} />

            {SERIES.map((series) => (
              <Area
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                strokeWidth={2}
                className={series.className}
                // Titik hanya muncul saat ditunjuk. Menggambarnya di setiap
                // ember membuat grafik 30 hari jadi kalung manik-manik.
                dot={false}
                activeDot={{ r: 4, className: series.activeDotClassName }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda ditulis sendiri, bukan `<Legend>` bawaan Recharts, supaya
          bentuk dan warnanya persis sama dengan penanda status di tabel. */}
      <ul className="flex flex-wrap items-center gap-4 text-xs text-content-muted">
        {SERIES.map((series) => (
          <li key={series.key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={cn('size-2.5 rounded-full', series.dot)} />
            {series.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
