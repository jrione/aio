/**
 * Preferensi tampilan.
 *
 * ## Kenapa tidak ada tombol Simpan di sini
 *
 * Setiap pilihan di kartu ini berlaku **seketika** dan hasilnya langsung
 * terlihat di layar yang sama. Tombol Simpan untuk sesuatu yang sudah berubah di
 * depan mata bukan cuma berlebihan — ia menimbulkan pertanyaan yang tidak punya
 * jawaban baik ("kalau saya tidak menekannya, apakah temanya balik lagi?").
 *
 * Itu juga yang membedakan kartu ini dari kartu profil dan notifikasi di
 * sebelahnya: keduanya mengirim sesuatu ke server dan bisa gagal, jadi keduanya
 * butuh tombol yang bisa ditekan dan keadaan yang bisa gagal.
 *
 * ## Kenapa preferensi ini tidak disimpan di server
 *
 * Tema dan lebar sidebar milik **perangkat**, bukan akun. Menyimpannya di server
 * terdengar lebih rapi sampai seseorang memakai laptop terang di kantor dan
 * ponsel gelap di malam hari — lalu preferensi yang "tersinkron" jadi gangguan
 * yang tidak bisa dimatikan. Keduanya tinggal di `localStorage` lewat
 * `src/store/`, dan itu pula yang membuat perubahannya tidak butuh reload:
 * tidak ada perjalanan ke server sama sekali.
 */
import { Card } from '@/components/ui/Card.tsx'
import { Switch } from '@/components/ui/Switch.tsx'
import { ThemeSwitcher } from '@/components/ThemeSwitcher.tsx'
import { useResolvedTheme, useThemePreference } from '@/store/theme.ts'
import { sidebarCollapsedStore } from '@/store/ui.ts'

const RESOLVED_LABEL = { light: 'terang', dark: 'gelap' } as const

export function AppearanceCard() {
  const preference = useThemePreference()
  const resolved = useResolvedTheme()
  const collapsed = sidebarCollapsedStore.use()

  return (
    <Card
      title="Tampilan"
      description="Berlaku di perangkat ini saja, dan langsung tanpa memuat ulang halaman."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-content">Tema</p>
          <ThemeSwitcher className="max-w-xs" />
          <p className="text-xs text-content-muted">
            {preference === 'system'
              ? `Mengikuti pengaturan sistem — saat ini ${RESOLVED_LABEL[resolved]}. Berubah sendiri saat pengaturan sistem berubah.`
              : `Dipaksa ${RESOLVED_LABEL[resolved]}, mengabaikan pengaturan sistem.`}
          </p>
        </div>

        <Switch
          checked={collapsed}
          onChange={(next) => {
            sidebarCollapsedStore.set(next)
          }}
          label="Ciutkan sidebar"
          hint="Menyisakan rel ikon saja. Sama dengan tombol di header, tapi bertahan antar sesi."
        />
      </div>
    </Card>
  )
}
