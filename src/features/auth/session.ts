/**
 * Sesi pengguna: satu-satunya sumber kebenaran soal "siapa yang sedang masuk".
 *
 * ## Tiga keadaan, bukan dua
 *
 * `unknown` ada karena aplikasi memang tidak tahu jawabannya saat halaman baru
 * dimuat: access token hanya hidup di memori, jadi setelah reload ia hilang dan
 * satu-satunya cara mengetahui statusnya adalah bertanya ke server. Selama
 * jawaban itu belum tiba, route guard menahan diri — tanpa keadaan ketiga ini,
 * menekan F5 di halaman mana pun akan melempar pengguna ke halaman login
 * sepersekian detik sebelum melemparnya kembali.
 *
 * ## Apa yang bertahan, apa yang tidak
 *
 *   - token           → memori (`src/services/auth-token.ts`), tidak bertahan
 *   - identitas & role → memori, ikut lenyap dan dipulihkan dari server
 *   - penanda sesi     → localStorage, hanya berisi id pengguna
 *   - refresh token    → cookie `HttpOnly` milik server, tak terbaca kode ini
 *
 * Yang menjaga sesi tetap hidup adalah cookie itu, bukan localStorage. Penanda
 * di localStorage tidak memberi akses apa pun; ia cuma alat komunikasi antar
 * tab dan penanda "layak dicoba pulihkan".
 */
import { authService } from '@/services/auth/auth.service.ts'
import type { SessionResponse, User } from '@/services/auth/auth.types.ts'
import { setAuthToken } from '@/services/auth-token.ts'
import { queryClient } from '@/services/query-client.ts'
import { onUnauthorized } from '@/services/unauthorized.ts'
import { createPersistedStore, createStore } from '@/store/create-store.ts'
import { STORAGE_KEYS } from '@/store/storage-keys.ts'

/**
 * `unknown` = belum bisa dijawab; aplikasi masih menanyakan ke server apakah
 * ada sesi yang bisa dipulihkan. Lihat catatan di kepala file.
 */
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous'

export interface SessionState {
  readonly status: SessionStatus
  readonly user: User | null
}

const ANONYMOUS: SessionState = { status: 'anonymous', user: null }
const UNKNOWN: SessionState = { status: 'unknown', user: null }

const markerStore = createPersistedStore<string>({
  key: STORAGE_KEYS.session,
  fallback: '',
  decode: (raw) => raw,
})

/*
 * Pengunjung yang belum pernah masuk langsung dinyatakan `anonymous`, tanpa
 * lebih dulu menanyakan apa pun ke server: tanpa penanda, tidak ada sesi yang
 * bisa dipulihkan. Halaman login pun muncul seketika alih-alih menampilkan
 * "memuat" selama satu perjalanan bolak-balik yang sudah pasti gagal.
 */
const sessionStore = createStore<SessionState>(markerStore.get() === '' ? ANONYMOUS : UNKNOWN)

/* ─────────────────────────────────────────────────────────────
 * Perpanjangan token
 * ───────────────────────────────────────────────────────────── */

/**
 * Seberapa awal token diperpanjang sebelum waktunya habis.
 *
 * Jedanya harus cukup untuk menyerap jam klien yang meleset dan satu perjalanan
 * request yang lambat. Menunggu sampai token benar-benar mati berarti request
 * pertama setelah itu gagal `401` — pengguna melihat error untuk sesuatu yang
 * seharusnya tidak pernah ia sadari.
 */
const RENEW_LEAD_MS = 60_000

/**
 * Untuk token berumur pendek, `RENEW_LEAD_MS` bisa lebih panjang dari umur
 * token itu sendiri. Batas bawah ini menjaga jadwalnya tetap masuk akal
 * (perpanjang di tiga perempat umurnya) alih-alih jatuh ke masa lalu.
 */
const RENEW_MIN_RATIO = 0.75

let renewTimer: ReturnType<typeof setTimeout> | undefined

const cancelRenew = () => {
  if (renewTimer !== undefined) clearTimeout(renewTimer)
  renewTimer = undefined
}

const scheduleRenew = (expiresIn: number) => {
  cancelRenew()
  const lifetime = expiresIn * 1000
  const delay = Math.max(lifetime - RENEW_LEAD_MS, lifetime * RENEW_MIN_RATIO)
  renewTimer = setTimeout(() => {
    void renewSession()
  }, delay)
}

/* ─────────────────────────────────────────────────────────────
 * Mulai & akhiri sesi
 * ───────────────────────────────────────────────────────────── */

/**
 * Memasang sesi baru dari balasan server. Dipakai login maupun perpanjangan.
 *
 * Urutan di dalamnya penting: `sessionStore` diperbarui **sebelum**
 * `markerStore`. Penanda itulah yang memicu langganan di bawah, dan langganan
 * itu membandingkan dirinya dengan sesi yang sedang berlaku — kalau urutannya
 * terbalik, ia melihat sesi lama dan menyimpulkan ada perubahan dari tab lain
 * yang sebenarnya baru saja kita lakukan sendiri.
 */
export function startSession({ token, expiresIn, user }: SessionResponse): void {
  setAuthToken(token)
  sessionStore.set({ status: 'authenticated', user })
  markerStore.set(user.id)
  scheduleRenew(expiresIn)
}

/**
 * Memperbarui identitas pengguna tanpa menyentuh token atau jadwal perpanjangan.
 *
 * Dipakai setelah pengguna mengubah profilnya sendiri (Issue #13). Sengaja tidak
 * lewat `startSession`: yang berubah cuma nama, dan memanggil `startSession`
 * akan menjadwalkan ulang perpanjangan token seolah-olah sesi baru saja dimulai
 * — memperpanjang umur token secara diam-diam setiap kali seseorang menyunting
 * namanya.
 *
 * Tidak berbuat apa-apa bila tidak ada sesi. Balasan yang datang terlambat —
 * setelah pengguna keluar — tidak boleh menghidupkan kembali identitasnya.
 */
export function updateSessionUser(user: User): void {
  const current = sessionStore.get()
  if (current.status !== 'authenticated') return
  sessionStore.set({ status: 'authenticated', user })
}

interface EndSessionOptions {
  /**
   * `true` = beri tahu server supaya cookie refresh-nya dicabut. Dipakai saat
   * pengguna menekan "keluar", tapi **tidak** saat sesi berakhir karena
   * kedaluwarsa — di situ cookie-nya memang sudah mati, dan memanggil server
   * hanya menambah satu request yang pasti sia-sia.
   */
  revoke: boolean
}

/**
 * Mengakhiri sesi dan membersihkan semua jejaknya.
 *
 * Idempoten dengan sengaja: beberapa request yang berjalan berbarengan bisa
 * sama-sama dijawab `401`, dan masing-masing akan memanggil fungsi ini.
 *
 * `queryClient.clear()` bukan pelengkap. Tanpa itu, seluruh data pengguna
 * sebelumnya masih tersimpan di cache — dan pengguna berikutnya yang masuk di
 * komputer yang sama akan melihatnya sekejap sebagai data basi sebelum request
 * pertamanya selesai.
 */
function endSession({ revoke }: EndSessionOptions): void {
  if (sessionStore.get().status === 'anonymous' && markerStore.get() === '') return

  cancelRenew()
  setAuthToken(null)
  sessionStore.set(ANONYMOUS)
  markerStore.set('')
  queryClient.clear()

  if (revoke) {
    // Kegagalannya diabaikan: sesi di sisi klien sudah berakhir apa pun jawaban
    // server, dan menahan pengguna di halaman terproteksi karena permintaan
    // "keluar" gagal terkirim adalah hasil yang lebih buruk.
    void authService.logout().catch(() => undefined)
  }
}

/**
 * Menukar cookie refresh dengan access token baru.
 *
 * Dipakai di tiga saat: memulihkan sesi ketika aplikasi dimuat, memperpanjang
 * token sebelum mati, dan menyusul sesi yang dimulai di tab lain. Gagal berarti
 * sesinya memang sudah habis.
 */
async function renewSession(): Promise<void> {
  try {
    startSession(await authService.refresh())
  } catch {
    endSession({ revoke: false })
  }
}

/** Dipanggil saat pengguna menekan "keluar". */
export function signOut(): void {
  endSession({ revoke: true })
}

/**
 * Mencoba memulihkan sesi saat aplikasi baru dimuat.
 *
 * Dipanggil sekali dari `App.tsx`, bukan sebagai efek samping saat modul ini
 * diimpor. Modul yang menembakkan request hanya karena diimpor akan melakukannya
 * juga di tempat-tempat yang tidak menginginkannya — dan urutannya jadi
 * bergantung pada urutan impor, hal yang tidak ditulis siapa pun.
 *
 * Aman dipanggil berkali-kali: React StrictMode memang menjalankan efek dua kali
 * di mode pengembangan.
 */
let bootstrap: Promise<void> | undefined

export function bootstrapSession(): void {
  if (sessionStore.get().status !== 'unknown') return
  bootstrap ??= renewSession()
}

/* ─────────────────────────────────────────────────────────────
 * Sinkronisasi antar tab
 * ───────────────────────────────────────────────────────────── */

/**
 * Menyamakan sesi antar tab lewat penanda di localStorage.
 *
 * Tanpa ini, menekan "keluar" di satu tab meninggalkan tab lain mengira dirinya
 * masih masuk — lengkap dengan menu dan tombol aksi yang seluruhnya akan gagal
 * `401` begitu disentuh. Arah sebaliknya sama pentingnya: masuk di satu tab
 * membuat tab lain yang sedang menampilkan halaman login ikut masuk, karena
 * cookie refresh-nya memang milik browser, bukan milik satu tab.
 */
markerStore.subscribe(() => {
  const marker = markerStore.get()
  const { status, user } = sessionStore.get()

  // Pemulihan awal sedang berjalan; biarkan ia yang menyimpulkan.
  if (status === 'unknown') return

  if (marker === '') {
    endSession({ revoke: false })
    return
  }

  if (user?.id !== marker) void renewSession()
})

/**
 * Sesi berakhir juga bisa datang dari arah lain: sebuah request ditolak `401`.
 *
 * Yang **tidak** dilakukan di sini: mencoba refresh diam-diam lalu mengulang
 * request yang gagal. Itu menuntut antrean request yang tertunda beserta
 * penanganan kasus "beberapa request gagal bersamaan", dan keputusan sebesar
 * itu tidak pantas diselundupkan ke dalam Issue #10. Jadwal perpanjangan di
 * atas sudah menjaga sesi yang sehat tetap hidup; `401` yang tetap lolos
 * berarti tokennya memang benar-benar ditolak.
 */
onUnauthorized(() => {
  endSession({ revoke: false })
})

/* ─────────────────────────────────────────────────────────────
 * Pembacaan dari komponen
 * ───────────────────────────────────────────────────────────── */

/** Keadaan sesi lengkap. Dipakai route guard yang perlu membedakan `unknown`. */
export function useSession(): SessionState {
  return sessionStore.use()
}

/** Pengguna yang sedang masuk, atau `null`. */
export function useCurrentUser(): User | null {
  return sessionStore.use().user
}
