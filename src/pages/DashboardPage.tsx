/**
 * Halaman dashboard (route `/`).
 *
 * Isinya masih sementara: petak design token yang sebelumnya tinggal di
 * `App.tsx`, dipindah ke sini karena `App.tsx` kini hanya memasang router.
 * Widget dashboard sungguhan dibangun di Issue #11.
 */
import { Link } from 'react-router'

import { ROUTES } from '@/routes/routes.ts'

/** Tingkat pada skala brand yang ditampilkan di petak token. */
const BRAND_STEPS = [100, 300, 500, 700, 900] as const

/**
 * Kelas Tailwind ditulis lengkap (bukan dirakit lewat template string) karena
 * Tailwind memindai source sebagai teks — `bg-brand-${step}` tidak akan terdeteksi.
 */
const BRAND_SWATCHES: Record<(typeof BRAND_STEPS)[number], string> = {
  100: 'bg-brand-100',
  300: 'bg-brand-300',
  500: 'bg-brand-500',
  700: 'bg-brand-700',
  900: 'bg-brand-900',
}

const STATUS_BADGES = [
  { label: 'success', className: 'bg-success-soft text-success-strong ring-success/30' },
  { label: 'warning', className: 'bg-warning-soft text-warning-strong ring-warning/30' },
  { label: 'danger', className: 'bg-danger-soft text-danger-strong ring-danger/30' },
  { label: 'info', className: 'bg-info-soft text-info-strong ring-info/30' },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight text-content">Dashboard</h1>
        <p className="mt-2 text-content-muted">
          Halaman ini terproteksi. Widget aslinya dibangun di Issue #11 — sementara ini isinya petak
          design system dari Issue #3.
        </p>
      </div>

      <section className="rounded-xl border border-edge bg-surface-raised p-6">
        <h2 className="font-display text-xl font-medium text-content">Design token</h2>

        <h3 className="mt-6 text-xs font-semibold tracking-wider text-content-muted uppercase">
          Brand
        </h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {BRAND_STEPS.map((step) => (
            <li key={step} className="text-center">
              <div className={`${BRAND_SWATCHES[step]} size-12 rounded-lg border border-edge`} />
              <span className="mt-1 block font-mono text-xs text-content-muted">{step}</span>
            </li>
          ))}
        </ul>

        <h3 className="mt-6 text-xs font-semibold tracking-wider text-content-muted uppercase">
          Semantik
        </h3>
        <ul className="mt-2 flex flex-wrap gap-2">
          {STATUS_BADGES.map(({ label, className }) => (
            <li key={label}>
              <span
                className={`${className} inline-flex rounded-full px-3 py-1 font-mono text-xs font-medium ring`}
              >
                {label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className="text-sm text-content-muted">
        Buka{' '}
        <Link to={ROUTES.settings} className="text-brand-600 underline underline-offset-4">
          Settings
        </Link>{' '}
        untuk melihat perpindahan halaman tanpa reload.
      </p>
    </div>
  )
}
