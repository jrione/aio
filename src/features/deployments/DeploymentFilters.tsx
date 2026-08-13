/**
 * Baris penyaring di atas tabel deployment.
 *
 * Komponen ini tidak menyimpan apa pun. Nilainya datang dari URL dan
 * perubahannya dikembalikan ke URL — lihat `deployment-filter.ts`. Itu yang
 * membuat "kotak pencarian masih berisi kata lama padahal tabelnya sudah
 * berganti" mustahil terjadi: hanya ada satu sumber, dan komponen ini
 * membacanya.
 */
import { Button } from '@/components/ui/Button.tsx'
import { SearchInput } from '@/components/ui/SearchInput.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { isFiltered } from '@/features/deployments/deployment-filter.ts'
import { DEPLOYMENT_STATUS_OPTIONS } from '@/features/deployments/labels.ts'
import { ENVIRONMENT_OPTIONS } from '@/features/formatters.ts'
import type { UrlStateOptions } from '@/routes/useUrlState.ts'
import type { DeploymentFilter } from '@/services/deployments/deployment.types.ts'

export interface DeploymentFiltersProps {
  filter: DeploymentFilter
  /** Menerima perubahan sebagian; halaman yang menerjemahkannya ke URL. */
  onChange: (patch: Partial<DeploymentFilter>, options?: UrlStateOptions) => void
  /** Mengembalikan seluruh penyaring ke keadaan kosong. */
  onReset: () => void
}

export function DeploymentFilters({ filter, onChange, onReset }: DeploymentFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <SearchInput
        id="deployment-cari"
        value={filter.q ?? ''}
        aria-label="Cari deployment"
        placeholder="Cari layanan, versi, commit, atau pemicu…"
        // Mengetik menghasilkan perubahan bertubi-tubi, jadi entri riwayatnya
        // diganti alih-alih ditambah — Kembali membatalkan pencariannya, bukan
        // menghapus satu huruf. Lihat `UrlStateOptions`.
        onChange={(q) => {
          onChange({ q: q === '' ? undefined : q }, { replace: true })
        }}
        wrapperClassName="grow"
      />

      <Select
        id="deployment-lingkungan"
        aria-label="Saring menurut lingkungan"
        options={ENVIRONMENT_OPTIONS}
        value={filter.environment ?? ''}
        onChange={(event) => {
          // Nilai `<select>` bertipe string biasa. Mencocokkannya kembali ke
          // daftar pilihan lebih jujur daripada memaksakannya jadi tipe union
          // lewat cast — dan gratis, karena daftarnya memang sudah ada.
          const next = ENVIRONMENT_OPTIONS.find((option) => option.value === event.target.value)
          onChange({ environment: next && next.value !== '' ? next.value : undefined })
        }}
        wrapperClassName="sm:w-48"
      />

      <Select
        id="deployment-status"
        aria-label="Saring menurut status"
        options={DEPLOYMENT_STATUS_OPTIONS}
        value={filter.status ?? ''}
        onChange={(event) => {
          const next = DEPLOYMENT_STATUS_OPTIONS.find(
            (option) => option.value === event.target.value,
          )
          onChange({ status: next && next.value !== '' ? next.value : undefined })
        }}
        wrapperClassName="sm:w-44"
      />

      {/* Tombol reset hanya ada saat memang ada yang bisa direset — tombol yang
          selalu tampak tapi sering tidak melakukan apa-apa mengajari pengguna
          untuk mengabaikannya. */}
      {isFiltered(filter) && (
        <Button variant="ghost" onClick={onReset}>
          Reset
        </Button>
      )}
    </div>
  )
}
