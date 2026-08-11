/**
 * Ikon dari sprite `public/icons.svg`.
 *
 * Komponen pertama yang tinggal di `src/components/`, sekaligus bukti bahwa
 * alias `@/` bekerja: dipakai `App.tsx` lewat `import { Icon } from
 * '@/components/Icon.tsx'`, bukan path relatif.
 *
 * Ikon di sini murni dekoratif — labelnya selalu ada di teks sebelahnya —
 * jadi disembunyikan dari screen reader.
 */
interface IconProps {
  /** Id simbol di `public/icons.svg`, mis. `github-icon`. */
  name: string
  /** Utility class Tailwind. Default `size-5`. */
  className?: string
}

export function Icon({ name, className = 'size-5' }: IconProps) {
  return (
    <svg className={className} role="presentation" aria-hidden="true">
      <use href={`/icons.svg#${name}`} />
    </svg>
  )
}
