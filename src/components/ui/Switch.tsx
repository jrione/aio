/**
 * Sakelar nyala/mati.
 *
 * Dibangun di atas `<input type="checkbox">` sungguhan yang diberi
 * `role="switch"`, bukan `<button aria-pressed>`. Alasannya sama dengan kenapa
 * `Select` memakai `<select>` dan `Modal` memakai `<dialog>` (Issue #7): checkbox
 * bawaan sudah benar soal Spasi, urutan fokus, pengelompokan dalam `<form>`, dan
 * pembacaan screen reader. `role="switch"` hanya mengubah cara ia dibacakan —
 * "nyala/mati" alih-alih "tercentang/tidak" — tanpa mengambil satu pun perilaku
 * bawaannya.
 *
 * Input-nya disembunyikan lewat `sr-only`, bukan `display: none`, supaya ia
 * tetap ada di urutan fokus. Tampilannya digambar dua `<span>` di sebelahnya
 * yang bereaksi lewat varian `peer-*`.
 *
 * ## Perbedaannya dari checkbox biasa
 *
 * Sakelar berlaku **seketika**; checkbox menunggu tombol Simpan. Kalau sebuah
 * pilihan hanya berlaku setelah form dikirim, checkbox yang benar — sakelar yang
 * hasilnya baru muncul beberapa klik kemudian melanggar apa yang dijanjikan
 * bentuknya.
 */
import { useId, type ReactNode } from 'react'

import { cn } from '@/utils/cn.ts'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  /** Teks di sebelah sakelar. Kosongkan bila labelnya ada di kolom tabel. */
  label?: ReactNode
  /** Keterangan kecil di bawah label. */
  hint?: ReactNode
  /** Wajib bila `label` kosong — tanpanya sakelar tidak punya nama. */
  'aria-label'?: string
  disabled?: boolean
  className?: string
}

export function Switch({
  checked,
  onChange,
  label,
  hint,
  'aria-label': ariaLabel,
  disabled = false,
  className,
}: SwitchProps) {
  const id = useId()
  const hintId = `${id}-hint`

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <label
        htmlFor={id}
        className={cn(
          'relative inline-flex h-5 w-9 shrink-0 items-center',
          disabled ? 'cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          // Redundan bagi browser — `checked` pada checkbox sudah terpetakan
          // sendiri — tapi ditulis karena `role="switch"` menuntutnya secara
          // formal, dan alat bantu yang membaca atribut mentah tidak semuanya
          // ikut memetakannya. Nilainya diturunkan dari prop yang sama, jadi
          // keduanya mustahil berbeda.
          aria-checked={checked}
          disabled={disabled}
          aria-label={ariaLabel}
          aria-describedby={hint ? hintId : undefined}
          onChange={(event) => {
            onChange(event.target.checked)
          }}
          className="peer sr-only"
        />

        {/* Landasan. Cincin fokus dipasang di sini, bukan di input yang tak
            terlihat, supaya fokus keyboard benar-benar terlihat. */}
        <span
          aria-hidden="true"
          className="h-5 w-9 rounded-full bg-surface-sunken ring ring-edge transition-colors peer-checked:bg-brand-500 peer-checked:ring-brand-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand-500 peer-disabled:opacity-50"
        />

        {/* Kenop. Warnanya putih di kedua tema — ia benda di atas landasan,
            bukan permukaan yang ikut berganti tema. */}
        <span
          aria-hidden="true"
          className="absolute left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4 peer-disabled:opacity-50 motion-reduce:transition-none"
        />
      </label>

      {(label ?? hint) && (
        <div className="min-w-0">
          {label && (
            <label
              htmlFor={id}
              className={cn(
                'text-sm text-content',
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
              )}
            >
              {label}
            </label>
          )}
          {hint && (
            <p id={hintId} className="text-xs text-content-muted">
              {hint}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
