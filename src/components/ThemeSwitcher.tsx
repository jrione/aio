/**
 * Pemilih tema: Sistem / Terang / Gelap.
 *
 * Dibangun di atas `<input type="radio">` sungguhan, bukan tiga `<button>`
 * dengan `aria-pressed`. Alasannya sama dengan kenapa `Select` memakai
 * `<select>` dan `Modal` memakai `<dialog>` (Issue #7): radio bawaan sudah
 * memberi navigasi panah kiri/kanan, pengelompokan yang dikenali screen reader,
 * dan semantik "pilih tepat satu" — tiga hal yang kalau ditiru dengan tombol
 * harus ditulis, diuji, dan dirawat sendiri.
 *
 * Radionya disembunyikan secara visual (bukan `display: none`, yang akan
 * mengeluarkannya dari urutan fokus), lalu `<label>`-nya yang diberi tampilan.
 */
import { Icon } from '@/components/Icon.tsx'
import { setTheme, useThemePreference, type ThemePreference } from '@/store/theme.ts'
import { cn } from '@/utils/cn.ts'

interface Option {
  value: ThemePreference
  label: string
  icon: string
}

const OPTIONS: readonly Option[] = [
  { value: 'system', label: 'Sistem', icon: 'monitor-icon' },
  { value: 'light', label: 'Terang', icon: 'sun-icon' },
  { value: 'dark', label: 'Gelap', icon: 'moon-icon' },
]

export function ThemeSwitcher({ className }: { className?: string }) {
  const preference = useThemePreference()

  return (
    <fieldset className={cn('flex gap-1 rounded-lg bg-surface-sunken p-1', className)}>
      <legend className="sr-only">Tema tampilan</legend>

      {OPTIONS.map((option) => {
        const active = option.value === preference
        return (
          <label
            key={option.value}
            className={cn(
              'flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors',
              // `focus-within` memindahkan cincin fokus dari input yang tak
              // terlihat ke label yang terlihat — tanpa itu, menavigasi dengan
              // keyboard terasa seperti fokus menghilang.
              'focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500',
              active
                ? 'bg-surface-raised font-medium text-content shadow-sm'
                : 'text-content-muted hover:text-content',
            )}
          >
            <input
              type="radio"
              name="tema"
              value={option.value}
              checked={active}
              onChange={() => {
                setTheme(option.value)
              }}
              className="sr-only"
            />
            <Icon name={option.icon} className="size-4 shrink-0" />
            {option.label}
          </label>
        )
      })}
    </fieldset>
  )
}
