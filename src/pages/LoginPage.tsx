/**
 * Halaman login (route `/login`), hanya untuk yang belum masuk.
 *
 * ## Dua lapis validasi, dan kenapa keduanya perlu
 *
 * Validasi di browser ada demi kecepatan umpan balik: "email wajib diisi" tidak
 * pantas menunggu satu perjalanan ke server. Ia **bukan** pengganti validasi di
 * server, yang tetap memeriksa ulang segalanya — apa pun yang ditulis di file
 * ini bisa dilewati siapa saja lewat devtools.
 *
 * Sebaliknya, sebagian aturan hanya bisa dijawab server ("email tidak
 * terdaftar", "password salah"). Jawaban itu kembali sebagai `422` dengan
 * `errors` per field dan ditempelkan ke field yang tepat lewat `fieldErrors()`,
 * bukan berakhir sebagai satu banner merah di atas form.
 *
 * ## Yang tidak ada di sini: navigasi setelah berhasil
 *
 * Halaman ini tidak memanggil `navigate()` sama sekali. Begitu sesi dimulai,
 * `RouteGuard` yang memindahkan pengguna — lihat catatannya di sana.
 */
import { useState, type FormEvent } from 'react'
import { useLocation } from 'react-router'

import { Button } from '@/components/ui/Button.tsx'
import { Card } from '@/components/ui/Card.tsx'
import { Input } from '@/components/ui/Input.tsx'
import { useLogin } from '@/features/auth/use-login.ts'
import { isRedirectState } from '@/routes/redirect-state.ts'
import { fieldErrors } from '@/services/api-error.ts'

interface FormErrors {
  email?: string
  password?: string
}

/**
 * Cukup untuk menangkap salah ketik yang jelas ("rani@", "rani.example.com"),
 * dan sengaja tidak lebih.
 *
 * Aturan email yang benar-benar lengkap jauh lebih longgar daripada yang
 * diperkirakan orang, dan pola yang mencoba menirunya selalu berakhir menolak
 * alamat yang sah — biasanya milik orang yang paling tidak bisa berbuat apa-apa
 * soal itu. Yang menentukan sebuah email sungguhan ada tetap server, atau email
 * verifikasi yang benar-benar sampai.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const validate = (email: string, password: string): FormErrors => {
  const errors: FormErrors = {}

  if (email.trim() === '') errors.email = 'Email wajib diisi.'
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Format email belum benar.'

  if (password === '') errors.password = 'Password wajib diisi.'

  return errors
}

export default function LoginPage() {
  const location = useLocation()
  const login = useLogin()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  /*
   * Pesan kesalahan baru muncul setelah percobaan kirim pertama.
   *
   * Menandai field merah sejak huruf pertama diketik berarti memberi tahu orang
   * bahwa ia salah padahal ia baru mulai. Setelah sekali mencoba kirim, barulah
   * validasinya ikut hidup pada tiap ketikan — di titik itu koreksi langsung
   * memang yang dibutuhkan.
   */
  const [submitted, setSubmitted] = useState(false)

  const clientErrors = validate(email, password)
  const serverErrors = fieldErrors(login.error)
  const errors: FormErrors = submitted ? { ...serverErrors, ...clientErrors } : {}

  const destination = isRedirectState(location.state) ? location.state.from : null

  // `error.message` sudah berbahasa Indonesia (lihat `api-error.ts`), tapi
  // kegagalan per field sudah tampil di bawah field-nya masing-masing — tidak
  // perlu diulang sebagai spanduk di atas.
  const banner =
    login.error && Object.keys(serverErrors).length === 0 ? login.error.message : undefined

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(clientErrors).length > 0) return
    login.mutate({ email: email.trim(), password })
  }

  return (
    <Card title="Masuk" description="Gunakan akun AIO DevOps Anda untuk melanjutkan.">
      {/*
        `noValidate` mematikan pesan bawaan browser. Bukan karena validasinya
        tidak berguna, melainkan karena tampilannya tidak bisa diatur, isinya
        berbeda-beda tiap browser, dan gelembungnya menghilang begitu pengguna
        mengklik ke tempat lain — pesan yang ditulis sendiri tetap terbaca.
      */}
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
        {banner && (
          <p
            role="alert"
            className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger-strong"
          >
            {banner}
          </p>
        )}

        <Input
          id="login-email"
          label="Email"
          type="email"
          autoComplete="username"
          placeholder="nama@perusahaan.com"
          value={email}
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value)
          }}
        />

        <Input
          id="login-password"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value)
          }}
        />

        <Button type="submit" block loading={login.isPending}>
          {login.isPending ? 'Memeriksa…' : 'Masuk'}
        </Button>
      </form>

      {destination !== null && (
        <p className="mt-4 text-center text-xs text-content-muted">
          Setelah masuk kamu diarahkan ke <code className="font-mono">{destination}</code>
        </p>
      )}

      {/*
        Kredensial demo hanya untuk mode pengembangan.

        Ditulis dengan `import.meta.env.DEV`, bukan `env.isDev`, supaya seluruh
        blok ini jadi kode mati saat build produksi dan benar-benar lenyap dari
        bundle — daftar akun contoh tidak pantas ikut terkirim ke pengguna.
      */}
      {import.meta.env.DEV && (
        <div className="mt-6 rounded-lg border border-edge bg-surface p-3 text-xs text-content-muted">
          <p className="font-medium text-content">Akun demo (mode mock)</p>
          <ul className="mt-1.5 flex flex-col gap-0.5">
            <li>
              <code className="font-mono">admin@aio.dev</code> / admin123 — semua menu
            </li>
            <li>
              <code className="font-mono">operator@aio.dev</code> / operator123 — tanpa Settings
            </li>
            <li>
              <code className="font-mono">viewer@aio.dev</code> / viewer123 — hanya Dashboard
            </li>
            <li>
              <code className="font-mono">sesipendek@aio.dev</code> / sesipendek — sesi 15 detik
            </li>
          </ul>
        </div>
      )}
    </Card>
  )
}
