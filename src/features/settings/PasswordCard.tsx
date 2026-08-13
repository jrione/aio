/**
 * Ganti password.
 *
 * Tiga hal yang sengaja diputuskan begini:
 *
 * **Password saat ini tetap diminta**, meski penggunanya jelas sudah masuk.
 * Sesi yang masih hidup membuktikan seseorang pernah tahu passwordnya, bukan
 * bahwa orang yang sedang duduk di depan layar itu tahu. Tanpa field ini, laptop
 * yang ditinggal tak terkunci selama dua menit cukup untuk mengambil alih akun.
 *
 * **Konfirmasi diperiksa di browser saja.** Server tidak perlu tahu ada dua
 * kotak — yang dikirim cuma satu password baru. Mengirim konfirmasinya berarti
 * mengirim password yang sama dua kali tanpa alasan.
 *
 * **Sesi tidak diakhiri setelah berhasil.** Alasannya di
 * `src/features/auth/use-profile.ts`.
 */
import { useState } from 'react'

import { Button } from '@/components/ui/Button.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { useToast } from '@/components/ui/toast-context.ts'
import { useChangePassword } from '@/features/auth/use-profile.ts'
import { fieldErrors } from '@/services/api-error.ts'

const PASSWORD_MIN = 8

export function PasswordCard() {
  const toast = useToast()
  const change = useChangePassword()

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const clientErrors: Record<string, string> = {}
  if (currentPassword === '') clientErrors.currentPassword = 'Password saat ini wajib diisi.'
  if (newPassword.length < PASSWORD_MIN)
    clientErrors.newPassword = 'Password baru minimal 8 karakter.'
  else if (newPassword === currentPassword)
    clientErrors.newPassword = 'Password baru harus berbeda dari yang sekarang.'
  if (confirmation !== newPassword) clientErrors.confirmation = 'Konfirmasi tidak cocok.'

  const serverErrors = fieldErrors(change.error)

  const errorFor = (field: string): string | undefined =>
    submitted ? (serverErrors[field] ?? clientErrors[field]) : undefined

  // Kesalahan yang tidak menempel di field mana pun — mis. server sedang mati.
  const banner =
    submitted && change.isError && Object.keys(serverErrors).length === 0
      ? change.error.message
      : undefined

  const submit = () => {
    setSubmitted(true)
    if (Object.keys(clientErrors).length > 0) return

    change.mutate(
      { currentPassword, newPassword },
      {
        onSuccess: () => {
          setCurrentPassword('')
          setNewPassword('')
          setConfirmation('')
          setSubmitted(false)
          toast.show({
            tone: 'success',
            title: 'Password diganti',
            description: 'Pakai password baru saat masuk berikutnya.',
          })
        },
      },
    )
  }

  return (
    <Card
      title="Ganti password"
      description="Password saat ini tetap diminta meski Anda sudah masuk."
      footer={
        <div className="flex justify-end">
          <Button onClick={submit} loading={change.isPending}>
            Ganti password
          </Button>
        </div>
      }
    >
      <div className="flex max-w-sm flex-col gap-4">
        {banner && (
          <p
            role="alert"
            className="rounded-lg border border-danger/30 bg-danger-soft px-3 py-2 text-sm text-danger-strong"
          >
            {banner}
          </p>
        )}

        <Input
          id="password-sekarang"
          label="Password saat ini"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          error={errorFor('currentPassword')}
          onChange={(event) => {
            setCurrentPassword(event.target.value)
          }}
        />

        <Input
          id="password-baru"
          label="Password baru"
          type="password"
          autoComplete="new-password"
          hint="Minimal 8 karakter."
          value={newPassword}
          error={errorFor('newPassword')}
          onChange={(event) => {
            setNewPassword(event.target.value)
          }}
        />

        <Input
          id="password-konfirmasi"
          label="Ulangi password baru"
          type="password"
          autoComplete="new-password"
          value={confirmation}
          error={errorFor('confirmation')}
          onChange={(event) => {
            setConfirmation(event.target.value)
          }}
        />
      </div>
    </Card>
  )
}
