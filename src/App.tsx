import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import { env } from './config/env.ts'
import './App.css'

interface InfoLink {
  href: string
  label: string
  /** Id simbol di `/icons.svg`. Dipakai bila tautan memakai ikon SVG. */
  icon?: string
  /** Alternatif ikon: gambar impor (logo Vite/React). */
  image?: string
  imageClass?: string
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
      { href: 'https://vite.dev/', label: 'Explore Vite', image: viteLogo, imageClass: 'logo' },
      {
        href: 'https://react.dev/',
        label: 'Learn more',
        image: reactLogo,
        imageClass: 'button-icon',
      },
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

function Icon({ name, className = 'button-icon' }: { name: string; className?: string }) {
  return (
    <svg className={className} role="presentation" aria-hidden="true">
      <use href={`/icons.svg#${name}`}></use>
    </svg>
  )
}

function InfoCard({ id, icon, title, subtitle, links }: InfoCardData) {
  return (
    <div id={id}>
      <Icon name={icon} className="icon" />
      <h2>{title}</h2>
      <p>{subtitle}</p>
      <ul>
        {links.map(({ href, label, icon: linkIcon, image, imageClass }) => (
          <li key={href}>
            <a href={href} target="_blank" rel="noreferrer">
              {linkIcon ? (
                <Icon name={linkIcon} />
              ) : (
                <img className={imageClass} src={image} alt="" />
              )}
              {label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <section id="center">
        <div className="hero">
          <img src={heroImg} className="base" width="170" height="179" alt="" />
          <img src={reactLogo} className="framework" alt="React logo" />
          <img src={viteLogo} className="vite" alt="Vite logo" />
        </div>
        <div>
          <h1>{env.appName}</h1>
          <p>
            Edit <code>src/App.tsx</code> and save to test <code>HMR</code>
          </p>
        </div>
        <button type="button" className="counter" onClick={() => setCount((count) => count + 1)}>
          Count is {count}
        </button>
      </section>

      <div className="ticks"></div>

      <section id="next-steps">
        {INFO_CARDS.map((card) => (
          <InfoCard key={card.id} {...card} />
        ))}
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
