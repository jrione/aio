/**
 * Profil pengguna: nama yang bisa diubah, identitas yang tidak.
 *
 * Email dan peran ditampilkan hanya-baca, dan itu bukan kemalasan. Keduanya
 * milik penyedia identitas — hari ini backend, nanti Keycloak — dan halaman
 * profil yang bisa mengubahnya berarti aplikasi ini menulis balik ke sumber
 * kebenaran orang lain. Peran khususnya: seseorang yang bisa mengubah perannya
 * sendiri berarti tidak punya peran sama sekali.
 *
 * Yang tampil disertai keterangan, bukan sekadar kata "viewer": pengguna yang
 * menemukan tombol menghilang perlu tahu **kenapa**, dan menyembunyikan
 * jawabannya di dokumentasi berarti tidak menjawabnya.
 */
import { useState } from 'react'

import { Badge } from '@/components/ui/Badge.tsx'
import { Button } from '@/components/ui/Button.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { useToast } from '@/components/ui/toast-context.ts'
import { useUpdateProfile } from '@/features/auth/use-profile.ts'
import { ROLE_LABEL } from '@/features/formatters.ts'
import { fieldErrors } from '@/services/api-error.ts'
import type { User } from '@/services/auth/auth.types.ts'

const NAME_MIN = 2
const NAME_MAX = 60

export function ProfileCard({ user }: { user: User }) {
  const toast = useToast()
  const update = useUpdateProfile()

  const [name, setName] = useState(user.name)
  const [submitted, setSubmitted] = useState(false)

  const trimmed = name.trim()
  const clientError =
    trimmed.length < NAME_MIN
      ? 'Nama minimal 2 karakter.'
      : trimmed.length > NAME_MAX
        ? 'Nama maksimal 60 karakter.'
        : undefined

  const serverError = fieldErrors(update.error).name
  const error = submitted ? (serverError ?? clientError) : undefined

  // Tombol simpan mati selama tidak ada yang berubah. Form yang tombolnya selalu
  // hidup mengundang klik yang tidak melakukan apa-apa, lalu toast "tersimpan"
  // untuk perubahan yang tidak pernah ada.
  const dirty = trimmed !== user.name

  const submit = () => {
    setSubmitted(true)
    if (clientError !== undefined) return

    update.mutate(
      { name: trimmed },
      {
        onSuccess: () => {
          setSubmitted(false)
          toast.show({ tone: 'success', title: 'Profil tersimpan' })
        },
      },
    )
  }

  const role = ROLE_LABEL[user.role]

  return (
    <Card
      title="Profil"
      description="Nama yang muncul di riwayat deployment dan di menu pengguna."
      footer={
        <div className="flex items-center justify-end gap-3">
          {dirty && <span>Ada perubahan yang belum disimpan.</span>}
          <Button onClick={submit} loading={update.isPending} disabled={!dirty}>
            Simpan
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          id="profil-nama"
          label="Nama"
          value={name}
          error={error}
          maxLength={NAME_MAX}
          onChange={(event) => {
            setName(event.target.value)
          }}
          wrapperClassName="max-w-sm"
        />

        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs tracking-wider text-content-muted uppercase">Email</dt>
            <dd className="mt-1 font-mono text-sm text-content">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs tracking-wider text-content-muted uppercase">Peran</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <Badge tone="info">{role.name}</Badge>
              <span className="text-sm text-content-muted">{role.description}</span>
            </dd>
          </div>
        </dl>

        <p className="text-xs text-content-muted">
          Email dan peran dikelola administrator dan tidak bisa diubah dari halaman ini.
        </p>
      </div>
    </Card>
  )
}
