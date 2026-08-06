import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { env } from './config/env.ts'

/**
 * Halaman sementara. Isinya sekaligus jadi bukti hidup bahwa design token di
 * `src/index.css` benar-benar terpakai: skala brand, warna semantik, font, dan
 * spacing semuanya dipanggil lewat utility class — tanpa satu pun file CSS
 * per-komponen. Diganti layout asli di Issue #6.
 */

interface InfoLink {
  href: string
  label: string
  /** Id simbol di `/icons.svg`. Dipakai bila tautan memakai ikon SVG. */
  icon?: string
  /** Alternatif ikon: gambar impor (logo Vite/React). */
  image?: string
}

interface InfoCardData {
  id: string
  icon: string
  title: string
  subtitle: string
  links: InfoLink[]
}

const INFO_CARDS: InfoCardData[] = [
  {
    id: 'docs',
    icon: 'documentation-icon',
    title: 'Documentation',
    subtitle: 'Your questions, answered',
    links: [
      { href: 'https://vite.dev/', label: 'Explore Vite', image: viteLogo },
      { href: 'https://react.dev/', label: 'Learn more', image: reactLogo },
      { href: 'https://tailwindcss.com/docs', label: 'Tailwind CSS', icon: 'documentation-icon' },
    ],
  },
  {
    id: 'social',
    icon: 'social-icon',
    title: 'Connect with us',
    subtitle: 'Join the Vite community',
    links: [
      { href: 'https://github.com/vitejs/vite', label: 'GitHub', icon: 'github-icon' },
      { href: 'https://chat.vite.dev/', label: 'Discord', icon: 'discord-icon' },
      { href: 'https://x.com/vite_js', label: 'X.com', icon: 'x-icon' },
      { href: 'https://bsky.app/profile/vite.dev', label: 'Bluesky', icon: 'bluesky-icon' },
    ],
  },
]

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

interface StatusBadge {
  label: string
  className: string
}

const STATUS_BADGES: StatusBadge[] = [
  { label: 'success', className: 'bg-success-soft text-success-strong ring-success/30' },
  { label: 'warning', className: 'bg-warning-soft text-warning-strong ring-warning/30' },
  { label: 'danger', className: 'bg-danger-soft text-danger-strong ring-danger/30' },
  { label: 'info', className: 'bg-info-soft text-info-strong ring-info/30' },
]

function Icon({ name, className = 'size-5' }: { name: string; className?: string }) {
  return (
    <svg className={className} role="presentation" aria-hidden="true">
      <use href={`/icons.svg#${name}`} />
    </svg>
  )
}

function InfoCard({ icon, title, subtitle, links }: InfoCardData) {
  return (
    <section className="border-edge bg-surface-raised rounded-xl border p-6 text-left">
      <Icon name={icon} className="text-brand-500 size-7" />
      <h2 className="text-content font-display mt-4 text-xl font-medium">{title}</h2>
      <p className="text-content-muted mt-1 text-sm">{subtitle}</p>
      <ul className="mt-4 flex flex-wrap gap-2">
        {links.map(({ href, label, icon: linkIcon, image }) => (
          <li key={href}>
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="border-edge text-content hover:border-brand-500 hover:text-brand-600 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
            >
              {linkIcon ? <Icon name={linkIcon} /> : <img className="size-5" src={image} alt="" />}
              {label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

function TokenShowcase() {
  return (
    <section className="border-edge bg-surface-raised rounded-xl border p-6 text-left">
      <h2 className="text-content font-display text-xl font-medium">Design token</h2>
      <p className="text-content-muted mt-1 text-sm">
        Didefinisikan sekali di{' '}
        <code className="bg-surface-sunken rounded px-1 py-0.5">src/index.css</code>, dipakai lewat
        utility class.
      </p>

      <h3 className="text-content-muted mt-6 text-xs font-semibold tracking-wider uppercase">
        Brand
      </h3>
      <ul className="mt-2 flex flex-wrap gap-2">
        {BRAND_STEPS.map((step) => (
          <li key={step} className="text-center">
            <div className={`${BRAND_SWATCHES[step]} border-edge size-12 rounded-lg border`} />
            <span className="text-content-muted mt-1 block font-mono text-xs">{step}</span>
          </li>
        ))}
      </ul>

      <h3 className="text-content-muted mt-6 text-xs font-semibold tracking-wider uppercase">
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
  )
}

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="mx-auto flex min-h-svh max-w-5xl flex-col items-center px-6 py-12 text-center">
      <div className="relative flex h-44 w-44 items-center justify-center">
        <img src={heroImg} className="w-44" width="170" height="179" alt="" />
        <img src={reactLogo} className="absolute size-12" alt="Logo React" />
        <img src={viteLogo} className="absolute bottom-2 size-8" alt="Logo Vite" />
      </div>

      <h1 className="text-content font-display mt-8 text-4xl font-medium tracking-tight sm:text-5xl">
        {env.appName}
      </h1>
      <p className="text-content-muted mt-3">
        Edit{' '}
        <code className="bg-surface-sunken rounded px-1.5 py-0.5 font-mono text-sm">
          src/App.tsx
        </code>{' '}
        lalu simpan untuk menguji{' '}
        <code className="bg-surface-sunken rounded px-1.5 py-0.5 font-mono text-sm">HMR</code>
      </p>

      <button
        type="button"
        onClick={() => setCount((current) => current + 1)}
        className="bg-brand-500 hover:bg-brand-600 mt-6 rounded-lg px-4 py-2 font-medium text-white transition-colors"
      >
        Count is {count}
      </button>

      <div className="mt-12 grid w-full gap-4 sm:grid-cols-2">
        <TokenShowcase />
        {INFO_CARDS.map((card) => (
          <InfoCard key={card.id} {...card} />
        ))}
      </div>
    </div>
  )
}

export default App
