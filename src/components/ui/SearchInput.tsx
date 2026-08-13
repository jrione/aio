/**
 * Kotak pencarian dengan jeda.
 *
 * ## Kenapa ini komponen tersendiri, bukan `<Input>` biasa
 *
 * Karena pencarian punya satu sifat yang tidak dimiliki isian lain: **nilai
 * yang diketik dan nilai yang berlaku bukan hal yang sama.** Setiap huruf
 * mengubah yang pertama; hanya jeda mengetik yang mengubah yang kedua. Selama
 * keduanya belum dipisah, "ketikkan `billing`" berarti tujuh request, tujuh
 * entri riwayat browser, dan tabel yang berkedip tujuh kali.
 *
 * Pemisahan itu ditaruh di sini, sekali, supaya halaman yang memakainya cukup
 * memperlakukannya seperti isian terkendali biasa dan tidak perlu tahu ada
 * `setTimeout` di dalamnya.
 *
 * ## Nilai dari luar tetap menang
 *
 * `value` bisa berubah tanpa pengguna mengetik apa pun: tombol Kembali, tautan
 * yang dibuka dari luar, tombol "Reset penyaring". Kalau itu diabaikan, kotak
 * pencarian akan menampilkan kata yang sudah tidak berlaku lagi — dan pengguna
 * akan menyalahkan hasil pencariannya, bukan kotaknya.
 */
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { control, describedById } from '@/components/ui/control.ts'
import { Field } from '@/components/ui/Field.tsx'
import { Icon } from '@/components/Icon.tsx'
import { cn } from '@/utils/cn.ts'

export interface SearchInputProps {
  id: string
  /** Kata kunci yang sedang berlaku — biasanya dibaca dari query string. */
  value: string
  /** Dipanggil setelah pengetikan berhenti selama `delayMs`. */
  onChange: (value: string) => void
  label?: ReactNode
  /** Label untuk screen reader bila `label` tidak ditampilkan. */
  'aria-label'?: string
  placeholder?: string
  hint?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** Lama diam sebelum kata kunci dianggap final. */
  delayMs?: number
  wrapperClassName?: string
}

const DEFAULT_DELAY_MS = 300

export function SearchInput({
  id,
  value,
  onChange,
  label,
  'aria-label': ariaLabel,
  placeholder = 'Cari…',
  hint,
  size,
  delayMs = DEFAULT_DELAY_MS,
  wrapperClassName,
}: SearchInputProps) {
  const [draft, setDraft] = useState(value)

  /*
   * Menyelaraskan ketikan dengan nilai yang datang dari luar, saat render.
   *
   * Bukan lewat `useEffect`: efek berjalan setelah layar dilukis, jadi kotak
   * sempat menampilkan kata lama selama satu frame. Pola ini yang dianjurkan
   * React untuk menyesuaikan state terhadap perubahan props — React membuang
   * render yang tanggung lalu langsung mengulanginya dengan nilai yang benar.
   */
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setDraft(value)
  }

  /*
   * Callback disimpan di ref, bukan dijadikan dependency efek di bawah.
   *
   * Pemanggil hampir selalu mengoper fungsi anonim, yang identitasnya baru
   * setiap render. Kalau itu masuk ke daftar dependency, timer-nya disetel
   * ulang setiap kali induknya render — dan pada halaman yang cukup ramai,
   * pencarian jadi tidak pernah benar-benar terkirim.
   */
  const latestOnChange = useRef(onChange)
  useEffect(() => {
    latestOnChange.current = onChange
  })

  useEffect(() => {
    // Ketikan yang sudah sama dengan nilai berlaku tidak perlu dikirim ulang.
    // Ini pula yang membuat penyelarasan dari luar di atas tidak memantul balik
    // jadi perubahan baru.
    if (draft === value) return undefined

    const timer = setTimeout(() => {
      latestOnChange.current(draft)
    }, delayMs)
    return () => {
      clearTimeout(timer)
    }
  }, [draft, value, delayMs])

  const clear = () => {
    setDraft('')
    // Mengosongkan adalah keputusan tegas, bukan ketikan: hasilnya diterapkan
    // seketika tanpa menunggu jeda.
    latestOnChange.current('')
  }

  return (
    <Field id={id} label={label} hint={hint} className={wrapperClassName}>
      <div className="relative">
        <Icon
          name="search-icon"
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-content-muted"
        />

        <input
          id={id}
          // `type="search"` memberi tombol hapus bawaan di sebagian browser dan
          // Escape yang mengosongkan isi — keduanya perilaku yang memang
          // diharapkan, jadi tidak ada alasan memakai `type="text"`.
          type="search"
          value={draft}
          aria-label={ariaLabel}
          aria-describedby={hint ? describedById(id, 'hint') : undefined}
          placeholder={placeholder}
          onChange={(event) => {
            setDraft(event.target.value)
          }}
          className={cn(
            control({ size }),
            'pl-9',
            // Tombol hapus bawaan WebKit disembunyikan supaya tidak berdampingan
            // dengan tombol hapus di bawah, yang bentuknya konsisten lintas
            // browser dan punya label untuk screen reader.
            '[&::-webkit-search-cancel-button]:hidden',
            draft === '' ? '' : 'pr-9',
          )}
        />

        {draft !== '' && (
          <button
            type="button"
            onClick={clear}
            aria-label="Hapus kata kunci"
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1 text-content-muted transition-colors hover:bg-surface-sunken hover:text-content"
          >
            <Icon name="close-icon" className="size-4" />
          </button>
        )}
      </div>
    </Field>
  )
}
