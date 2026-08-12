/**
 * Tab.
 *
 * Mengikuti pola ARIA Tabs, termasuk *roving tabindex*: hanya tab aktif yang
 * bisa dijangkau Tab dari luar, dan perpindahan antar tab memakai panah
 * kiri/kanan plus Home/End. Itu yang membedakan tab sungguhan dari sekadar
 * tumpukan tombol — tanpanya, pengguna keyboard harus menekan Tab sekali per
 * tab hanya untuk melewati barisnya.
 */
import { useId, useRef, type ReactNode } from 'react'

import { cn } from '@/utils/cn.ts'

export interface TabItem {
  id: string
  label: ReactNode
  content: ReactNode
  disabled?: boolean
}

export interface TabsProps {
  items: readonly TabItem[]
  /** Id tab aktif. Komponen ini terkendali penuh oleh pemanggil. */
  value: string
  onChange: (id: string) => void
  /** Label daftar tab untuk screen reader. */
  label: string
  className?: string
}

export function Tabs({ items, value, onChange, label, className }: TabsProps) {
  const baseId = useId()
  const listRef = useRef<HTMLDivElement>(null)

  const tabId = (id: string) => `${baseId}-tab-${id}`
  const panelId = (id: string) => `${baseId}-panel-${id}`

  const selectable = items.filter((item) => !item.disabled)

  const focusTab = (id: string) => {
    onChange(id)
    // Fokus mengikuti seleksi (pola "automatic activation"). Elemennya baru
    // ada setelah render, jadi pencariannya lewat DOM, bukan ref per tab.
    requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLButtonElement>(`#${CSS.escape(tabId(id))}`)?.focus()
    })
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const current = selectable.findIndex((item) => item.id === value)
    if (current === -1 || selectable.length === 0) return

    const moves: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 }
    const step = moves[event.key]

    if (step !== undefined) {
      event.preventDefault()
      const next = (current + step + selectable.length) % selectable.length
      focusTab(selectable[next].id)
      return
    }

    if (event.key === 'Home') {
      event.preventDefault()
      focusTab(selectable[0].id)
    }
    if (event.key === 'End') {
      event.preventDefault()
      focusTab(selectable[selectable.length - 1].id)
    }
  }

  const active = items.find((item) => item.id === value)

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        className="flex gap-1 border-b border-edge"
      >
        {items.map((item) => {
          const selected = item.id === value
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={tabId(item.id)}
              aria-selected={selected}
              aria-controls={panelId(item.id)}
              // Roving tabindex: hanya tab terpilih yang ada di urutan Tab.
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => {
                onChange(item.id)
              }}
              // Penanganan panah ditaruh di tab, bukan di tablist. Selain
              // memang di situlah fokus berada, elemen ber-role tablist tidak
              // seharusnya ikut fokusable hanya demi menampung listener.
              onKeyDown={handleKeyDown}
              className={cn(
                '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
                selected
                  ? 'border-brand-500 text-brand-600'
                  : 'border-transparent text-content-muted hover:text-content',
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>

      {active && (
        <div
          role="tabpanel"
          id={panelId(active.id)}
          aria-labelledby={tabId(active.id)}
          tabIndex={0}
          className="py-4"
        >
          {active.content}
        </div>
      )}
    </div>
  )
}
