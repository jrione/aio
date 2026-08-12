/**
 * Navigasi antar halaman data.
 *
 * Daftar nomornya dihitung `pageItems()` di `src/utils/page-items.ts` — fungsi
 * murni yang bisa dibaca dan diuji terpisah dari JSX. Untuk jumlah halaman
 * banyak, yang di tengah diringkas jadi elipsis sehingga barisnya tidak pernah
 * melebar mengikuti data.
 */
import { cva } from 'class-variance-authority'

import { Icon } from '@/components/Icon.tsx'
import { cn } from '@/utils/cn.ts'
import { ELLIPSIS, pageItems } from '@/utils/page-items.ts'

const pageButton = cva(
  'inline-flex h-9 min-w-9 items-center justify-center rounded-lg px-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-40',
  {
    variants: {
      active: {
        true: 'bg-brand-500 font-medium text-white',
        false: 'text-content-muted hover:bg-surface-sunken hover:text-content',
      },
    },
    defaultVariants: { active: false },
  },
)

export interface PaginationProps {
  page: number
  pageCount: number
  onChange: (page: number) => void
  className?: string
}

export function Pagination({ page, pageCount, onChange, className }: PaginationProps) {
  if (pageCount <= 1) return null

  return (
    <nav aria-label="Navigasi halaman" className={cn('flex items-center gap-1', className)}>
      <button
        type="button"
        onClick={() => {
          onChange(page - 1)
        }}
        disabled={page <= 1}
        aria-label="Halaman sebelumnya"
        className={pageButton()}
      >
        <Icon name="chevron-down-icon" className="size-4 rotate-90" />
      </button>

      {pageItems(page, pageCount).map((item, index) =>
        item === ELLIPSIS ? (
          <span
            // Elipsis tidak punya identitas selain posisinya, dan posisinya
            // memang yang membedakan keduanya.
            key={`${ELLIPSIS}-${String(index)}`}
            aria-hidden="true"
            className="px-1 text-content-muted"
          >
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => {
              onChange(item)
            }}
            aria-current={item === page ? 'page' : undefined}
            aria-label={`Halaman ${String(item)}`}
            className={pageButton({ active: item === page })}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        onClick={() => {
          onChange(page + 1)
        }}
        disabled={page >= pageCount}
        aria-label="Halaman berikutnya"
        className={pageButton()}
      >
        <Icon name="chevron-down-icon" className="size-4 -rotate-90" />
      </button>
    </nav>
  )
}
