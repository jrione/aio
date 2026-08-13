/**
 * Dialog "Deployment baru".
 *
 * ## Validasi ada di dua tempat, dan itu memang seharusnya
 *
 * Yang di browser menjawab cepat pertanyaan yang jawabannya sudah diketahui di
 * browser: field kosong, format versi yang keliru. Yang di server menjawab
 * pertanyaan yang mustahil dijawab di sini: layanan itu masih ada atau tidak,
 * pengguna ini berhak merilis ke production atau tidak.
 *
 * Keduanya bertemu di satu tempat — `errorFor()` di bawah — supaya pesan server
 * mendarat di field yang tepat, bukan berakhir jadi satu banner merah yang
 * membuat pengguna menebak field mana yang salah. Bentuk `{ errors: { … } }`
 * dibaca `fieldErrors()` dari lapisan HTTP; kalau server menjawab dengan bentuk
 * lain, pesannya jatuh ke banner dan tidak ada yang meledak.
 *
 * ## Dialog ini ada hanya selama terbuka
 *
 * Pemanggilnya merender komponen ini saat dialognya perlu muncul, bukan
 * merendernya terus-menerus dengan prop `open` yang berganti. Akibatnya seluruh
 * state isian lahir dan mati bersama dialognya: tidak ada isian sisa dari
 * pembukaan sebelumnya, dan "Jalankan ulang" bisa mengisi nilai awal lewat
 * `initial` tanpa satu baris pun penyelarasan props→state — yang justru bagian
 * paling mudah salah dari form di dalam modal.
 */
import { useState } from 'react'

import { QueryState } from '@/components/QueryState.tsx'
import { Button } from '@/components/ui/Button.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Modal } from '@/components/ui/Modal.tsx'
import { Select } from '@/components/ui/Select.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { useToast } from '@/components/ui/toast-context.ts'
import { ENVIRONMENT_LABEL } from '@/features/formatters.ts'
import { fieldErrors } from '@/services/api-error.ts'
import {
  useCreateDeployment,
  useDeploymentServices,
} from '@/services/deployments/deployment.queries.ts'
import type { Deployment, NewDeployment } from '@/services/deployments/deployment.types.ts'
import { ENVIRONMENTS, type DeploymentEnvironment } from '@/services/environment.ts'

/** Format tag rilis yang diterima; sama dengan yang diperiksa server. */
const VERSION_PATTERN = /^v\d+\.\d+\.\d+$/

const ENVIRONMENT_CHOICES = ENVIRONMENTS.map((environment) => ({
  value: environment,
  label: ENVIRONMENT_LABEL[environment],
}))

interface NewDeploymentDialogProps {
  /** Nilai awal isian. Diisi "Jalankan ulang" dari deployment yang sedang dibuka. */
  initial?: Partial<NewDeployment>
  onClose: () => void
  /** Dipanggil setelah server menerima permintaannya. */
  onCreated?: (deployment: Deployment) => void
}

export function NewDeploymentDialog({ initial, onClose, onCreated }: NewDeploymentDialogProps) {
  const toast = useToast()
  const services = useDeploymentServices()
  const create = useCreateDeployment()

  const [service, setService] = useState(initial?.service ?? '')
  const [environment, setEnvironment] = useState<DeploymentEnvironment>(
    initial?.environment ?? 'staging',
  )
  const [version, setVersion] = useState(initial?.version ?? '')
  const [submitted, setSubmitted] = useState(false)

  const clientErrors: Record<string, string> = {}
  if (service === '') clientErrors.service = 'Pilih layanan yang akan dirilis.'
  if (version.trim() === '') clientErrors.version = 'Versi wajib diisi.'
  else if (!VERSION_PATTERN.test(version.trim()))
    clientErrors.version = 'Format versi harus seperti v1.2.3.'

  const serverErrors = fieldErrors(create.error)

  /*
   * Kesalahan baru ditampilkan setelah tombol ditekan sekali.
   *
   * Form yang sudah merah sebelum disentuh membuat pengguna merasa salah
   * padahal belum sempat mengisi apa pun. Setelah percobaan pertama, umpan
   * baliknya langsung — di situ ia memang membantu.
   */
  const errorFor = (field: string): string | undefined =>
    submitted ? (serverErrors[field] ?? clientErrors[field]) : undefined

  const submit = () => {
    setSubmitted(true)
    if (Object.keys(clientErrors).length > 0) return

    create.mutate(
      { service, environment, version: version.trim() },
      {
        onSuccess: (deployment) => {
          toast.show({
            tone: 'success',
            title: 'Deployment dijadwalkan',
            description: `${deployment.service} ${deployment.version} menuju ${ENVIRONMENT_LABEL[deployment.environment]}.`,
          })
          onCreated?.(deployment)
          onClose()
        },
      },
    )
  }

  // Kesalahan yang tidak menempel di field mana pun — mis. server sedang mati.
  const banner =
    submitted && create.isError && Object.keys(serverErrors).length === 0
      ? create.error.message
      : undefined

  return (
    <Modal
      open
      onClose={onClose}
      title="Deployment baru"
      description="Menjalankan rilis sebuah layanan ke lingkungan yang dipilih."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            Jalankan
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {banner && (
          <p
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-strong"
          >
            {banner}
          </p>
        )}

        {/* Daftar layanan datang dari server, jadi ia punya keadaan memuat dan
            keadaan gagal seperti data lain — bukan array yang ditempel di sini. */}
        <QueryState
          query={services}
          errorTitle="Gagal memuat daftar layanan"
          loading={<Skeleton className="h-16 w-full" />}
        >
          {(list) => (
            <Select
              id="deployment-baru-layanan"
              label="Layanan"
              placeholder="Pilih layanan"
              options={list.map((name) => ({ value: name, label: name }))}
              value={service}
              error={errorFor('service')}
              onChange={(event) => {
                setService(event.target.value)
              }}
            />
          )}
        </QueryState>

        <Select
          id="deployment-baru-lingkungan"
          label="Lingkungan"
          options={ENVIRONMENT_CHOICES}
          value={environment}
          error={errorFor('environment')}
          onChange={(event) => {
            const next = ENVIRONMENTS.find((candidate) => candidate === event.target.value)
            if (next) setEnvironment(next)
          }}
        />

        <Input
          id="deployment-baru-versi"
          label="Versi"
          placeholder="v1.2.3"
          hint="Tag rilis semantik, diawali huruf v."
          value={version}
          error={errorFor('version')}
          onChange={(event) => {
            setVersion(event.target.value)
          }}
        />
      </div>
    </Modal>
  )
}
