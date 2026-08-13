/**
 * Halaman daftar deployment (route `/deployments`).
 *
 * Modul domain pertama di aplikasi ini, dan pola susunannya sengaja dibuat
 * untuk ditiru modul berikutnya: halaman hanya merakit, seluruh isinya tinggal
 * di `src/features/deployments/`, dan tidak ada satu pun `useState` untuk
 * penyaring.
 *
 * Ketiadaan `useState` itu yang paling penting. Penyaring dan nomor halaman
 * hidup di query string lewat `useUrlState`, jadi keadaan yang dilihat pengguna
 * selalu sama dengan keadaan yang tertulis di bilah alamat — bisa dimuat ulang,
 * dibuka di tab baru, dan dikirim ke rekan kerja. Yang tersisa di sini hanya
 * satu state yang memang bukan milik URL: dialog sedang terbuka atau tidak.
 */
import { useState } from 'react'

import { Button } from '@/components/ui/Button.tsx'
import { Icon } from '@/components/Icon.tsx'
import { useCan } from '@/features/auth/permissions.ts'
import {
  applyFilterChange,
  deploymentFilterCodec,
  EMPTY_FILTER,
} from '@/features/deployments/deployment-filter.ts'
import { DeploymentFilters } from '@/features/deployments/DeploymentFilters.tsx'
import { DeploymentTable } from '@/features/deployments/DeploymentTable.tsx'
import { NewDeploymentDialog } from '@/features/deployments/NewDeploymentDialog.tsx'
import { useUrlState, type UrlStateOptions } from '@/routes/useUrlState.ts'
import type { DeploymentFilter } from '@/services/deployments/deployment.types.ts'

export default function DeploymentsPage() {
  const can = useCan()
  const [filter, setFilter] = useUrlState(deploymentFilterCodec)
  const [dialogOpen, setDialogOpen] = useState(false)

  const change = (patch: Partial<DeploymentFilter>, options?: UrlStateOptions) => {
    setFilter(applyFilterChange(filter, patch), options)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-prose text-sm text-content-muted">
          Riwayat rilis lintas layanan dan lingkungan. Penyaring di bawah tersimpan di alamat
          halaman, jadi tampilan ini bisa disalin dan dibagikan apa adanya.
        </p>

        {can('deployment:run') && (
          <Button
            onClick={() => {
              setDialogOpen(true)
            }}
          >
            <Icon name="deployment-icon" className="size-4" />
            Deployment baru
          </Button>
        )}
      </div>

      <DeploymentFilters
        filter={filter}
        onChange={change}
        onReset={() => {
          setFilter(EMPTY_FILTER)
        }}
      />

      <DeploymentTable
        filter={filter}
        onPageChange={(page) => {
          change({ page })
        }}
        onReset={() => {
          setFilter(EMPTY_FILTER)
        }}
      />

      {dialogOpen && (
        <NewDeploymentDialog
          onClose={() => {
            setDialogOpen(false)
          }}
        />
      )}
    </div>
  )
}
