/**
 * Preferensi notifikasi.
 *
 * ## Kenapa ada tombol Simpan di sini, tapi tidak di kartu Tampilan
 *
 * Karena yang ini pergi ke server, dan yang pergi ke server bisa gagal. Sakelar
 * yang langsung berubah lalu diam-diam gagal tersimpan adalah bentuk kegagalan
 * yang paling buruk: pengguna yakin sudah mematikan notifikasi, dan baru tahu
 * belum ketika ponselnya berbunyi jam dua pagi.
 *
 * Perubahan karena itu ditahan di state lokal dulu, dan kartu ini menyatakan
 * dengan jelas kalau ada yang belum tersimpan.
 *
 * ## Kenapa matriks, bukan satu sakelar per kanal
 *
 * "Kirim email" sebagai satu sakelar memaksa pilihan yang sama untuk deployment
 * yang gagal dan yang berhasil — padahal yang pertama layak membangunkan orang
 * dan yang kedua tidak. Begitu keduanya digabung, satu-satunya cara berhenti
 * dibanjiri email keberhasilan adalah mematikan email kegagalan juga.
 */
import { useState } from 'react'

import { QueryState } from '@/components/QueryState.tsx'
import { Button } from '@/components/ui/Button.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { Skeleton } from '@/components/ui/Skeleton.tsx'
import { Switch } from '@/components/ui/Switch.tsx'
import { Table, type TableColumn } from '@/components/ui/Table.tsx'
import { useToast } from '@/components/ui/toast-context.ts'
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/services/profile/profile.queries.ts'
import type {
  NotificationEvent,
  NotificationRule,
  NotificationSettings,
} from '@/services/profile/profile.types.ts'

const EVENT_LABEL: Record<NotificationEvent, { title: string; description: string }> = {
  'deployment.failed': {
    title: 'Deployment gagal',
    description: 'Rilis berhenti sebelum selesai.',
  },
  'deployment.succeeded': {
    title: 'Deployment berhasil',
    description: 'Rilis selesai dan sehat.',
  },
  'pipeline.failed': { title: 'Pipeline gagal', description: 'Build atau tes tidak lolos.' },
  'incident.opened': { title: 'Insiden dibuka', description: 'Gangguan baru dilaporkan.' },
}

export function NotificationsCard() {
  const settings = useNotificationSettings()

  return (
    <QueryState
      query={settings}
      errorTitle="Gagal memuat preferensi notifikasi"
      loading={
        <div className="w-full">
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      {(data) => (
        // `key` memaksa form dibuat ulang saat data dari server berganti — mis.
        // setelah masuk sebagai pengguna lain. Tanpa itu, state lokal di bawah
        // akan menahan preferensi milik pengguna sebelumnya.
        <NotificationsForm key={JSON.stringify(data)} initial={data} />
      )}
    </QueryState>
  )
}

function NotificationsForm({ initial }: { initial: NotificationSettings }) {
  const toast = useToast()
  const update = useUpdateNotificationSettings()

  const [draft, setDraft] = useState<NotificationSettings>(initial)

  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)

  const setRule = (event: NotificationEvent, patch: Partial<NotificationRule>) => {
    setDraft((current) => ({
      ...current,
      rules: current.rules.map((rule) => (rule.event === event ? { ...rule, ...patch } : rule)),
    }))
  }

  const columns: TableColumn<NotificationRule>[] = [
    {
      key: 'event',
      header: 'Kejadian',
      render: (rule) => (
        <div className="min-w-0">
          <p className="font-medium text-content">{EVENT_LABEL[rule.event].title}</p>
          <p className="text-xs text-content-muted">{EVENT_LABEL[rule.event].description}</p>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      align: 'center',
      className: 'w-20',
      render: (rule) => (
        <Switch
          checked={rule.email}
          // Label kolom tidak terbaca screen reader saat fokus ada di sakelar,
          // jadi tiap sakelar membawa namanya sendiri secara utuh.
          aria-label={`Email untuk ${EVENT_LABEL[rule.event].title}`}
          onChange={(email) => {
            setRule(rule.event, { email })
          }}
          className="justify-center"
        />
      ),
    },
    {
      key: 'inApp',
      header: 'Dalam aplikasi',
      align: 'center',
      className: 'w-32',
      render: (rule) => (
        <Switch
          checked={rule.inApp}
          aria-label={`Notifikasi dalam aplikasi untuk ${EVENT_LABEL[rule.event].title}`}
          onChange={(inApp) => {
            setRule(rule.event, { inApp })
          }}
          className="justify-center"
        />
      ),
    },
  ]

  const { quietHours } = draft

  return (
    <Card
      title="Notifikasi"
      description="Berlaku untuk akun Anda di semua perangkat."
      bodyClassName="p-0"
      footer={
        <div className="flex flex-wrap items-center justify-end gap-3">
          {dirty && <span>Ada perubahan yang belum disimpan.</span>}
          <Button
            disabled={!dirty}
            loading={update.isPending}
            onClick={() => {
              update.mutate(draft, {
                onSuccess: () => {
                  toast.show({ tone: 'success', title: 'Preferensi notifikasi tersimpan' })
                },
                onError: (error) => {
                  toast.show({
                    tone: 'danger',
                    title: 'Gagal menyimpan',
                    description: error.message,
                  })
                },
              })
            }}
          >
            Simpan
          </Button>
        </div>
      }
    >
      <Table columns={columns} rows={draft.rules} rowKey={(rule) => rule.event} />

      <div className="flex flex-col gap-4 border-t border-edge p-5">
        <Switch
          checked={quietHours.enabled}
          onChange={(enabled) => {
            setDraft((current) => ({ ...current, quietHours: { ...current.quietHours, enabled } }))
          }}
          label="Jam tenang"
          hint="Notifikasi ditahan pada rentang ini dan dikirim setelahnya."
        />

        <div className="flex flex-wrap items-end gap-3">
          <Input
            id="notifikasi-mulai"
            label="Dari"
            type="time"
            value={quietHours.from}
            disabled={!quietHours.enabled}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                quietHours: { ...current.quietHours, from: event.target.value },
              }))
            }}
            wrapperClassName="w-32"
          />
          <Input
            id="notifikasi-selesai"
            label="Sampai"
            type="time"
            value={quietHours.to}
            disabled={!quietHours.enabled}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                quietHours: { ...current.quietHours, to: event.target.value },
              }))
            }}
            wrapperClassName="w-32"
          />

          {/* Rentang yang melewati tengah malam adalah yang paling sering
              dipakai, jadi ia dinyatakan sah secara terbuka — bukan dibiarkan
              terlihat seperti isian yang keliru. */}
          {quietHours.enabled && quietHours.from > quietHours.to && (
            <p className="pb-2 text-xs text-content-muted">
              Melewati tengah malam — berlaku dari {quietHours.from} hingga {quietHours.to} esok
              harinya.
            </p>
          )}
        </div>
      </div>
    </Card>
  )
}
