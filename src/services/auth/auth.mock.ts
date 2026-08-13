/**
 * Backend tiruan untuk domain auth — sekaligus "satpam" seluruh mock.
 *
 * Berisi tiga hal yang di server sungguhan memang tinggal berdekatan:
 *   1. daftar akun demo beserta perannya,
 *   2. penerbitan & pemeriksaan access token,
 *   3. cookie refresh yang membuat sesi bertahan melewati reload halaman.
 *
 * `authorizeMockRequest()` di bawah dipakai `mock-transport.ts` sebagai
 * middleware untuk **semua** endpoint, bukan hanya endpoint auth. Itu penting:
 * kalau hanya `/auth/*` yang memeriksa token, seluruh penanganan `401` di
 * aplikasi tidak pernah benar-benar dijalani selama pengembangan, dan baru
 * ketahuan patah di hari backend sungguhan dipasang.
 *
 * Modul ini hanya terjangkau lewat `import()` dinamis di `http.ts`, jadi isinya
 * — termasuk daftar password demo — tidak ikut ke bundle utama saat aplikasi
 * memakai API asli.
 */
import type { SessionResponse, User } from '@/services/auth/auth.types.ts'
import type { MockRoute } from '@/services/mock/mock-transport.ts'

interface MockAccount extends User {
  /**
   * Password polos, dan itu wajar **hanya** karena ini backend tiruan yang
   * hidup di dalam browser. Server sungguhan menyimpan hash, dan frontend tidak
   * pernah melihat keduanya.
   */
  readonly password: string
  /** Umur access token dalam detik. */
  readonly tokenTtl: number
  /**
   * Umur sesi (cookie refresh) dalam detik, dihitung sejak login dan **tidak**
   * diperpanjang tiap refresh. Inilah batas mutlak sebuah sesi.
   */
  readonly sessionTtl: number
}

const FIFTEEN_MINUTES = 15 * 60
const EIGHT_HOURS = 8 * 60 * 60

const SEED_ACCOUNTS: readonly MockAccount[] = [
  {
    id: 'usr-001',
    name: 'Rani Wijaya',
    email: 'admin@aio.dev',
    role: 'admin',
    password: 'admin123',
    tokenTtl: FIFTEEN_MINUTES,
    sessionTtl: EIGHT_HOURS,
  },
  {
    id: 'usr-002',
    name: 'Bagas Prakoso',
    email: 'operator@aio.dev',
    role: 'operator',
    password: 'operator123',
    tokenTtl: FIFTEEN_MINUTES,
    sessionTtl: EIGHT_HOURS,
  },
  {
    id: 'usr-003',
    name: 'Dimas Haryanto',
    email: 'viewer@aio.dev',
    role: 'viewer',
    password: 'viewer123',
    tokenTtl: FIFTEEN_MINUTES,
    sessionTtl: EIGHT_HOURS,
  },
  {
    /*
     * Akun dengan sesi sengaja sangat pendek.
     *
     * Alur "token mati → pengguna kembali ke halaman login" adalah salah satu
     * yang paling sering rusak diam-diam, justru karena mengujinya biasanya
     * menuntut menunggu berjam-jam atau mengoprek jam sistem. Dengan akun ini
     * seluruh alurnya — perpanjangan otomatis yang berhasil, lalu yang gagal —
     * bisa diamati dalam waktu di bawah setengah menit.
     */
    id: 'usr-004',
    name: 'Sesi Pendek',
    email: 'sesipendek@aio.dev',
    role: 'operator',
    password: 'sesipendek',
    tokenTtl: 12,
    sessionTtl: 15,
  },
]

/**
 * Daftar akun yang **bisa berubah**, sama seperti daftar deployment di
 * `deployment.mock.ts`.
 *
 * Sejak Issue #13 ada halaman yang mengubah nama dan password pengguna. Kalau
 * mock membalas "berhasil" tanpa benar-benar mengubah apa pun, dua hal yang
 * justru paling ingin diperiksa jadi tidak teruji: nama di header ikut berganti
 * atau tidak, dan password baru benar-benar dipakai saat masuk lagi atau tidak.
 */
let accounts: readonly MockAccount[] = SEED_ACCOUNTS

const findAccount = (id: string): MockAccount | undefined =>
  accounts.find((account) => account.id === id)

/** Bentuk yang dikirim ke klien: akun tanpa password dan tanpa setelan sesi. */
const toUser = ({ id, name, email, role }: MockAccount): User => ({ id, name, email, role })

/* ─────────────────────────────────────────────────────────────
 * Yang dipakai mock domain lain
 *
 * Diekspor sebagai fungsi, bukan sebagai array `accounts` itu sendiri. Array
 * yang diekspor akan mengundang pemanggil mengubahnya langsung, dan aturan
 * "password tidak pernah keluar dari file ini" jadi bergantung pada kedisiplinan
 * tiap pemanggil alih-alih pada bentuk kodenya.
 * ───────────────────────────────────────────────────────────── */

/** Profil publik sebuah akun, atau `undefined` bila tidak ada. */
export const mockUserById = (id: string): User | undefined => {
  const account = findAccount(id)
  return account && toUser(account)
}

export const isMockPassword = (id: string, password: string): boolean =>
  findAccount(id)?.password === password

const replaceAccount = (id: string, patch: Partial<MockAccount>): User | undefined => {
  const current = findAccount(id)
  if (!current) return undefined
  const next: MockAccount = { ...current, ...patch }
  accounts = accounts.map((account) => (account.id === id ? next : account))
  return toUser(next)
}

export const setMockUserName = (id: string, name: string): User | undefined =>
  replaceAccount(id, { name })

export const setMockPassword = (id: string, password: string): boolean =>
  replaceAccount(id, { password }) !== undefined

/* ─────────────────────────────────────────────────────────────
 * Access token
 * ───────────────────────────────────────────────────────────── */

/**
 * Format token tiruan: `mock.<id akun>.<kedaluwarsa dalam ms>`.
 *
 * Sengaja bukan JWT sungguhan. Menandatangani token di dalam browser tidak
 * mengamankan apa pun — kuncinya toh ikut terkirim ke setiap pengunjung — jadi
 * yang tersisa hanyalah kerumitan yang menyamar sebagai keamanan. Yang perlu
 * ditiru cuma dua sifat yang benar-benar memengaruhi frontend: token itu buram
 * bagi klien, dan ia punya batas waktu.
 */
const TOKEN_PREFIX = 'mock'

const issueToken = (account: MockAccount): SessionResponse => ({
  token: `${TOKEN_PREFIX}.${account.id}.${String(Date.now() + account.tokenTtl * 1000)}`,
  expiresIn: account.tokenTtl,
  user: toUser(account),
})

const accountFromToken = (token: string): MockAccount | undefined => {
  const [prefix, id, expiresAt] = token.split('.')
  if (prefix !== TOKEN_PREFIX || id === undefined || expiresAt === undefined) return undefined
  if (Number(expiresAt) <= Date.now()) return undefined
  return accounts.find((account) => account.id === id)
}

/* ─────────────────────────────────────────────────────────────
 * Cookie refresh
 * ───────────────────────────────────────────────────────────── */

/**
 * Pengganti cookie `HttpOnly` yang di produksi dipasang server.
 *
 * Di sini ia terpaksa cookie biasa: tidak ada server yang bisa mengirim
 * `Set-Cookie`, dan JavaScript memang tidak diizinkan membuat cookie
 * `HttpOnly`. Yang ditiru adalah perilakunya — bertahan melewati reload,
 * punya batas umur sendiri, terkirim otomatis, dan **tidak pernah disentuh
 * kode aplikasi**. Seluruh sentuhan terhadapnya terkurung di file ini, yang
 * hanya hidup di mode mock; `src/features/auth/` maupun `src/services/auth/`
 * tidak menyebut namanya sama sekali.
 */
const REFRESH_COOKIE = 'aio_mock_refresh'

const setRefreshCookie = (accountId: string, maxAge: number): void => {
  document.cookie = `${REFRESH_COOKIE}=${accountId}; path=/; max-age=${String(maxAge)}; SameSite=Lax`
}

const clearRefreshCookie = (): void => {
  document.cookie = `${REFRESH_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

const readRefreshCookie = (): string | undefined =>
  document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${REFRESH_COOKIE}=`))
    ?.slice(REFRESH_COOKIE.length + 1)

/* ─────────────────────────────────────────────────────────────
 * Middleware & route
 * ───────────────────────────────────────────────────────────── */

/**
 * Memeriksa header `Authorization` sebuah request mock.
 *
 * Mengembalikan penggunanya bila tokennya sah, atau `undefined` bila header-nya
 * tidak ada, bentuknya salah, akunnya tidak dikenal, atau tokennya sudah lewat
 * waktu. Pemanggilnya — `mock-transport.ts` — yang mengubah `undefined` jadi
 * `401`.
 */
export function authorizeMockRequest(headers: Headers): User | undefined {
  const header = headers.get('Authorization')
  if (header === null || !header.startsWith('Bearer ')) return undefined
  const account = accountFromToken(header.slice('Bearer '.length))
  return account && toUser(account)
}

/** Kesalahan validasi per field, bentuknya sama dengan yang dibaca LoginPage. */
interface FieldErrors {
  email?: string
  password?: string
}

const validate = (body: unknown): { errors: FieldErrors; email: string; password: string } => {
  // Body request adalah `unknown` dan memang harus diperlakukan begitu: ia
  // datang dari luar, dan backend sungguhan pun tidak boleh memercayainya.
  const source: object = typeof body === 'object' && body !== null ? body : {}
  const email = 'email' in source && typeof source.email === 'string' ? source.email.trim() : ''
  const password =
    'password' in source && typeof source.password === 'string' ? source.password : ''

  const errors: FieldErrors = {}
  if (email === '') errors.email = 'Email wajib diisi.'
  if (password === '') errors.password = 'Password wajib diisi.'

  return { errors, email, password }
}

export const authMockRoutes: readonly MockRoute[] = [
  {
    method: 'POST',
    path: '/auth/login',
    public: true,
    handle: ({ body }) => {
      const { errors, email, password } = validate(body)
      if (Object.keys(errors).length > 0) {
        return {
          status: 422,
          body: { message: 'Data yang dikirim belum lengkap.', errors },
        }
      }

      const account = accounts.find(
        (candidate) => candidate.email.toLowerCase() === email.toLowerCase(),
      )
      // Pesannya sengaja sama untuk "email tidak terdaftar" dan "password
      // salah". Membedakannya mengubah halaman login jadi alat untuk mengecek
      // apakah sebuah email punya akun di sini.
      if (!account || account.password !== password) {
        return { status: 401, body: { message: 'Email atau password salah.' } }
      }

      setRefreshCookie(account.id, account.sessionTtl)
      return { body: issueToken(account) }
    },
  },
  {
    method: 'POST',
    path: '/auth/refresh',
    public: true,
    handle: () => {
      const accountId = readRefreshCookie()
      const account = accounts.find((candidate) => candidate.id === accountId)
      if (!account) {
        return { status: 401, body: { message: 'Sesi sudah berakhir. Silakan masuk kembali.' } }
      }
      // Cookie-nya tidak dipasang ulang: umur sesi dihitung sejak login dan
      // tidak ikut diperpanjang tiap kali token diperbarui.
      return { body: issueToken(account) }
    },
  },
  {
    method: 'POST',
    path: '/auth/logout',
    /*
     * Publik dengan sengaja. Menuntut token yang masih sah untuk keluar berarti
     * pengguna yang tokennya sudah mati tidak bisa mencabut sesinya — dan
     * cookie refresh-nya tetap tertinggal di browser.
     */
    public: true,
    handle: () => {
      clearRefreshCookie()
      return {}
    },
  },
]
