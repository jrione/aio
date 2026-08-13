/**
 * Tombol aksi di halaman detail: batalkan, jalankan ulang, hapus.
 *
 * ## Kenapa "batalkan" adalah aksi ubah, dan bukan "edit"
 *
 * Sebuah deployment adalah catatan kejadian: ia terjadi pada waktu tertentu,
 * dengan commit tertentu, dijalankan orang tertentu. Menyediakan form untuk
 * menyunting ketiganya berarti menyediakan cara memalsukan riwayat. Satu-satunya
 * atribut yang memang boleh berubah adalah statusnya, dan hanya ke satu arah:
 * yang belum selesai bisa dibatalkan. Itulah aksi ubah di modul ini.
 *
 * Yang menggantikan "edit" dalam arti sehari-hari adalah **Jalankan ulang** —
 * dan itu membuat deployment baru, bukan mengubah yang lama, persis seperti
 * yang sebenarnya terjadi di sistem yang dirujuknya.
 *
 * ## Dua konfirmasi, bukan satu
 *
 * Membatalkan dan menghapus sama-sama merusak, tapi merusak hal yang berbeda:
 * yang satu menghentikan rilis yang sedang berjalan, yang lain membuang
 * catatannya. Satu dialog dengan dua tombol akan membuat keduanya tampak
 * setara — dan yang salah pilih tidak bisa membatalkan pilihannya.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/ui/Button.tsx'
import { Icon } from '@/components/Icon.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { useToast } from '@/components/ui/toast-context.ts'
import { useCan } from '@/features/auth/permissions.ts'
import { isCancelable } from '@/features/deployments/labels.ts'
import { ROUTES } from '@/routes/routes.ts'
import {
  useCancelDeployment,
  useDeleteDeployment,
} from '@/services/deployments/deployment.queries.ts'
import type { Deployment } from '@/services/deployments/deployment.types.ts'

interface DeploymentActionsProps {
  deployment: Deployment
  /** Membuka dialog "Deployment baru" dengan isian yang sudah terisi. */
  onRerun: () => void
}

export function DeploymentActions({ deployment, onRerun }: DeploymentActionsProps) {
  const can = useCan()
  const toast = useToast()
  const navigate = useNavigate()

  const cancel = useCancelDeployment()
  const remove = useDeleteDeployment()

  const [confirming, setConfirming] = useState<'cancel' | 'delete' | undefined>(undefined)

  // Pemeriksaan izin di sini menyembunyikan hal yang bukan urusan pengguna;
  // server tetap menolak sendiri request yang tidak berhak. Lihat catatan
  // panjang di `permissions.ts`.
  if (!can('deployment:run')) return null

  const runCancel = () => {
    cancel.mutate(deployment.id, {
      onSuccess: () => {
        setConfirming(undefined)
        toast.show({ tone: 'warning', title: 'Deployment dibatalkan' })
      },
      onError: (error) => {
        setConfirming(undefined)
        toast.show({ tone: 'danger', title: 'Gagal membatalkan', description: error.message })
      },
    })
  }

  const runDelete = () => {
    remove.mutate(deployment.id, {
      onSuccess: () => {
        setConfirming(undefined)
        toast.show({ tone: 'success', title: 'Catatan deployment dihapus' })
        // Halaman ini sudah tidak punya isi setelah datanya hilang, jadi
        // pengguna dikembalikan ke daftar alih-alih ditinggalkan menghadapi
        // 404 yang ia sendiri yang sebabkan.
        void navigate(ROUTES.deployments, { replace: true })
      },
      onError: (error) => {
        setConfirming(undefined)
        toast.show({ tone: 'danger', title: 'Gagal menghapus', description: error.message })
      },
    })
  }

  return (
    <>
      <div className="flex flex-wrap gap-2">
        {isCancelable(deployment.status) && (
          <Button
            variant="secondary"
            onClick={() => {
              setConfirming('cancel')
            }}
          >
            <Icon name="stop-icon" className="size-4" />
            Batalkan
          </Button>
        )}

        <Button variant="secondary" onClick={onRerun}>
          <Icon name="refresh-icon" className="size-4" />
          Jalankan ulang
        </Button>

        <Button
          variant="danger"
          onClick={() => {
            setConfirming('delete')
          }}
        >
          <Icon name="trash-icon" className="size-4" />
          Hapus
        </Button>
      </div>

      <Modal
        open={confirming === 'cancel'}
        onClose={() => {
          setConfirming(undefined)
        }}
        title="Batalkan deployment?"
        description={`${deployment.service} ${deployment.version} akan berhenti di tengah penggulirannya.`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(undefined)
              }}
            >
              Tidak jadi
            </Button>
            <Button variant="danger" onClick={runCancel} loading={cancel.isPending}>
              Batalkan deployment
            </Button>
          </>
        }
      >
        <p className="text-sm text-content-muted">
          Replika yang sudah tergulir tidak dikembalikan otomatis. Periksa kondisi layanan setelah
          pembatalan selesai.
        </p>
      </Modal>

      <Modal
        open={confirming === 'delete'}
        onClose={() => {
          setConfirming(undefined)
        }}
        title="Hapus catatan deployment?"
        description={`Catatan ${deployment.service} ${deployment.version} beserta log-nya akan hilang.`}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setConfirming(undefined)
              }}
            >
              Batal
            </Button>
            <Button variant="danger" onClick={runDelete} loading={remove.isPending}>
              Hapus
            </Button>
          </>
        }
      >
        <p className="text-sm text-content-muted">
          Tindakan ini tidak bisa dibatalkan. Layanan yang sudah terpasang tidak ikut terpengaruh —
          yang dihapus hanya catatannya.
        </p>
      </Modal>
    </>
  )
}
