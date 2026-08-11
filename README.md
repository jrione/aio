# aio-devops

Frontend _All-In-One DevOps Dashboard_. Single Page Application berbasis Vite + React.

Rencana kerja lengkap ada di `ISSUES.md`; dokumentasi penuh menyusul di Issue #17.

---

## Keputusan bahasa: TypeScript

> Status: **ditetapkan** · Issue #2 · berlaku untuk seluruh project

Project ini memakai **TypeScript**, bukan JavaScript. Seluruh file source
berekstensi `.ts` / `.tsx` — termasuk file konfigurasi (`vite.config.ts`) dan
script utilitas di `scripts/`.

**Alasan.** `ISSUES.md` menawarkan JavaScript sebagai default demi kecepatan,
tetapi keputusan diambil saat project baru berisi enam file. Migrasi di titik
ini praktis gratis, sedangkan setelah Issue #7 (design system) dan Issue #8
(lapisan API) biayanya jauh lebih besar. Lapisan konfigurasi environment juga
langsung diuntungkan: tipe `env` diturunkan otomatis dari `env.defaults.ts`,
sehingga salah ketik nama variabel tertangkap saat _type check_, bukan saat
runtime di browser.

**Konsekuensi.**

- Tidak boleh ada campuran `.jsx` dan `.tsx`. Aturan ini ditegakkan otomatis
  oleh `npm run check:lang`, yang gagal bila ada `.js` / `.jsx` / `.mjs` / `.cjs`
  masuk ke `src/` atau `scripts/`. Perlu pengecualian? Daftarkan di `ALLOWLIST`
  pada `scripts/check-language.ts` beserta alasannya.
- Seluruh issue berikutnya memakai `.tsx` untuk komponen React.
- `npm run build` menjalankan `tsc --noEmit` lebih dulu, jadi error tipe
  memutus build.

---

## Persyaratan

|                 |                                               |
| --------------- | --------------------------------------------- |
| Node.js         | **≥ 20.19** atau **≥ 22.12** (minimum Vite 8) |
| Package manager | npm                                           |

Versi yang dipakai dipin di `.nvmrc`. Jalankan `nvm use` sebelum mulai —
default Node di sebagian mesin masih 20.15.x dan akan gagal.

## Menjalankan

```bash
nvm use            # Node 24, sesuai .nvmrc
npm install
cp .env.example .env   # opsional — tanpa ini, nilai default yang dipakai
npm run dev            # http://localhost:3000
```

Port dev server diatur lewat `VITE_DEV_PORT` (default `3000`). Nilainya
divalidasi saat start — salah ketik atau port di luar rentang 1–65535 langsung
gagal, bukan diam-diam jatuh ke port lain. `strictPort` juga aktif, jadi kalau
port sudah dipakai proses lain Vite berhenti dengan pesan jelas alih-alih
pindah sendiri ke port berikutnya.

## Script npm

| Script                 | Fungsi                                           |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Dev server + HMR                                 |
| `npm run build`        | Type check lalu build produksi ke `dist/`        |
| `npm run preview`      | Serve hasil build secara lokal                   |
| `npm run typecheck`    | `tsc --noEmit` saja                              |
| `npm run lint`         | oxlint — cepat, dipakai sambil ngoding           |
| `npm run lint:types`   | oxlint + aturan yang butuh informasi tipe        |
| `npm run format`       | Prettier, tulis perubahan                        |
| `npm run format:check` | Prettier, hanya cek                              |
| `npm run env:example`  | Regenerate `.env.example` dari `env.defaults.ts` |
| `npm run env:check`    | Gagal bila `.env.example` tidak sinkron          |
| `npm run check:lang`   | Gagal bila ada file JavaScript di source tree    |
| `npm run check:styles` | Gagal bila ada file CSS per-komponen             |
| `npm run check:layers` | Gagal bila komponen mengimpor HTTP client/mock   |

## Styling: Tailwind CSS

> Status: **terpasang** · Issue #3

Tailwind **v4** dipasang lewat plugin resmi `@tailwindcss/vite`. Tidak ada
`tailwind.config.js` — sejak v4 seluruh konfigurasi ditulis sebagai CSS di
`src/index.css`, dan itulah **satu-satunya** file CSS di project ini.

Isinya tiga bagian berurutan:

1. `@import 'tailwindcss'` — direktif Tailwind.
2. `@theme` — design token statis: skala brand `50`–`950`, warna semantik
   (`success` / `warning` / `danger` / `info`), font family, spacing dasar.
3. `@layer base` — CSS variable tema light/dark plus reset tipis.

Tailwind membangkitkan utility langsung dari token, jadi menambah satu baris di
`@theme` cukup untuk memunculkan seluruh class turunannya:

```css
--color-brand-500: oklch(0.623 0.214 259.815);
```

```tsx
<button className="bg-brand-500 text-white hover:bg-brand-600">Deploy</button>
```

Warna semantik punya tiga tingkat dengan peran tetap — `-soft` untuk latar
badge, nama dasar untuk ikon/border, `-strong` untuk teks di atas latar `-soft`:

```tsx
<span className="bg-success-soft text-success-strong ring ring-success/30">Passed</span>
```

Token tema (`surface`, `surface-raised`, `surface-sunken`, `content`,
`content-muted`, `edge`) dideklarasikan lewat `@theme inline` di atas CSS
variable, sehingga `bg-surface` ikut berubah saat tema berganti. Saat ini
pergantian mengikuti `prefers-color-scheme`; toggle manual menyusul di Issue #15.

**Aturan.**

- Styling ditulis sebagai utility class di file `.tsx`. **Tidak ada** file CSS
  per-komponen — `npm run check:styles` gagal bila ada `.css` / `.scss` /
  `.sass` / `.less` / `.styl` selain `src/index.css`. Perlu pengecualian?
  Daftarkan di `ALLOWLIST` pada `scripts/check-styles.ts` beserta alasannya.
- Jangan menulis nilai warna atau font mentah di komponen — tambahkan token di
  `@theme` lalu panggil utility-nya.
- Nama class harus utuh di source. Tailwind memindai file sebagai teks, jadi
  `bg-brand-${step}` tidak akan terdeteksi; petakan ke string lengkap seperti
  `BRAND_SWATCHES` di `src/pages/DashboardPage.tsx`.

## Linter: oxlint, bukan ESLint

> Status: **ditetapkan** · Issue #4 · berlaku untuk seluruh project

Issue #4 awalnya meminta ESLint. **ESLint tidak bisa dipakai di project ini**,
dan itu konsekuensi langsung dari keputusan TypeScript 7 di Issue #2:

- `typescript-eslint` membatasi peer dependency-nya ke `typescript >=4.8.4 <6.1.0`
  — sama di rilis `latest` maupun `canary`.
- `typescript@7` tidak lagi mengekspos API compiler JS yang klasik. Entry point
  utamanya `./lib/version.cjs`; `require('typescript').createProgram` bernilai
  `undefined`, dan yang tersisa hanya `typescript/unstable/*` dengan bentuk API
  yang berbeda.

`@typescript-eslint/parser` berdiri di atas API klasik itu, jadi ESLint bukan
sekadar kurang optimal di sini — ia tidak bisa mem-parse `.tsx` project ini.
Memaksakannya berarti turun ke TypeScript 6.x dan membatalkan Issue #2.

**oxlint** mengisi perannya tanpa kompromi berarti: ia mem-parse TypeScript
sendiri (Rust), dan mengimplementasikan ulang plugin-plugin ESLint yang kita
butuhkan secara native — `react` (termasuk react-hooks), `typescript` (termasuk
@typescript-eslint), `import`, `jsx-a11y`, `promise`, `node`, `unicorn`. Bila
suatu saat ada aturan yang tidak ada padanannya, oxlint bisa memuat plugin gaya
ESLint lewat `jsPlugins`.

**Type-aware linting tetap didapat.** `npm run lint:types` menjalankan
`oxlint --type-aware`, yang memakai `oxlint-tsgolint` di atas typescript-go —
justru sejalan dengan pilihan compiler native. Aturan seperti
`no-floating-promises` bekerja di sana. `npm run lint` sengaja dibiarkan tanpa
type checking supaya tetap instan untuk dipakai berulang sambil menulis kode;
`lint:types` dijalankan sebelum push.

Konfigurasinya di `.oxlintrc.json` (format JSONC — komentar diperbolehkan).
Aturan yang dimatikan selalu disertai alasannya di file itu.

## Path alias

`@/` menunjuk ke `src/`:

```ts
import { Icon } from '@/components/Icon.tsx'
import { env } from '@/config/env.ts'
```

Didefinisikan **sekali** di `compilerOptions.paths` pada `tsconfig.json`. Dari
sana: TypeScript dan editor membacanya langsung, oxlint menemukannya sendiri,
dan Vite membacanya lewat `resolve.tsconfigPaths: true` — opsi bawaan sejak
Vite 8, menggantikan plugin `vite-tsconfig-paths`. Tidak ada daftar alias kedua
di `vite.config.ts`.

**Batasannya — ini penting.** Alias hanya berlaku untuk file di `src/`:

- `scripts/` dijalankan langsung oleh Node lewat type stripping, dan Node tidak
  membaca `paths` dari `tsconfig.json`. Tetap pakai path relatif di sana.
- `vite.config.ts` dan `env.defaults.ts` dimuat di luar konteks alias.
- `env.defaults.ts` ada di root, di luar jangkauan `@/`. Hanya
  `src/config/env.ts` dan `src/vite-env.d.ts` yang menjangkaunya, dengan path
  relatif.

Di dalam `src/`, impor yang keluar dari direktorinya sendiri **wajib** memakai
alias — `npm run lint` menolak pola `../`. Impor ke file TypeScript selalu
menyertakan ekstensi `.ts` / `.tsx` eksplisit, sesuai konvensi yang dipakai di
`scripts/`.

## Format kode

Prettier yang memformat, dengan dua catatan:

**`.editorconfig` adalah sumbernya, bukan pelengkap.** Prettier membaca file itu
dan mewarisi nilainya, jadi indentasi, akhir baris, dan lebar baris hanya
ditulis di `.editorconfig` — tidak diduplikasi di `.prettierrc.json`.
Pemetaannya: `indent_style` → `useTabs`, `indent_size` → `tabWidth`,
`max_line_length` → `printWidth`, `end_of_line` → `endOfLine`. Yang tersisa di
`.prettierrc.json` hanyalah opsi tanpa padanan EditorConfig (`semi`,
`singleQuote`, `trailingComma`, `arrowParens`) dan konfigurasi plugin.

**Urutan class Tailwind dirapikan otomatis** oleh `prettier-plugin-tailwindcss`.
Tailwind v4 tidak punya `tailwind.config.js`, jadi plugin diarahkan ke
stylesheet lewat `"tailwindStylesheet": "./src/index.css"` supaya token custom
ikut dikenali. Urutan class tidak perlu diperdebatkan di review — cukup jalankan
`npm run format`.

## Routing

> Status: **terpasang** · Issue #5 · React Router 8

`src/routes/routes.ts` adalah **satu-satunya** tempat route didaftarkan. Satu
entri di `ROUTE_TABLE` sekaligus menentukan path, siapa yang boleh membukanya,
kerangka halamannya, judul tab, apakah muncul di menu, dan chunk mana yang
di-load:

```ts
{
  id: 'settings',
  path: '/settings',
  access: 'protected',   // protected | guest | any
  layout: 'app',         // app | auth | bare
  title: 'Settings',     // judul sidebar, header, dan tab browser
  nav: { icon: 'settings-icon', group: 'sistem' },   // atau false
  load: () => import('@/pages/SettingsPage.tsx'),
}
```

Menambah halaman = tambah satu entri, lalu buat file halamannya di
`src/pages/`. Router, guard, menu navigasi, judul tab, dan pemecahan chunk
ikut menyesuaikan sendiri.

**Jangan menulis path mentah** di komponen. Pakai `ROUTES`, yang bertipe
literal sehingga salah ketik tertangkap saat type check:

```tsx
import { Link } from 'react-router'
import { ROUTES } from '@/routes/routes.ts'

<Link to={ROUTES.settings}>Settings</Link>   // ✅ bertipe '/settings'
<Link to="/setings">Settings</Link>          // ❌ lolos type check, mati saat diklik
```

**Menu sidebar.** Field `nav` merangkap konfigurasi menu: isi objek
`{ icon, group }` untuk memunculkannya di sidebar, atau `false` untuk halaman
yang tidak bermenu (login, 404). Grup dan urutannya didefinisikan di
`NAV_GROUPS` pada file yang sama.

Konfigurasi menu sengaja tidak dipisah ke file tersendiri. Begitu dipisah,
keduanya bisa menyimpang — menu menunjuk path yang sudah dihapus, atau halaman
baru lupa didaftarkan. Di sini keduanya satu baris yang sama, jadi mustahil
berbeda. Sidebar tinggal merender `NAV_MENU`, yang sudah dikelompokkan dan
dibuang grup kosongnya.

**Guard.** `access` diterjemahkan `RouteGuard` jadi satu aturan terpusat:
`protected` melempar tamu ke `/login` (sambil mengingat tujuan awal, supaya
dikembalikan ke sana setelah login), `guest` melempar yang sudah login ke
dashboard, `any` dibiarkan lewat. Status auth-nya masih palsu —
`src/features/auth/fake-auth.ts`, satu flag di localStorage — dan diganti
autentikasi sungguhan di Issue #10. Komponen tidak pernah membaca flag itu
langsung; semuanya lewat `useIsAuthenticated()`.

**Lazy loading.** Setiap halaman jadi chunk terpisah karena `load` memakai
`() => import(...)`. Terlihat di output `npm run build`:

```
dist/assets/NotFoundPage-*.js    0.67 kB
dist/assets/LoginPage-*.js       0.96 kB
dist/assets/SettingsPage-*.js    1.01 kB
dist/assets/DashboardPage-*.js   2.15 kB
```

Selagi chunk-nya diunduh, `RouteFallback` yang tampil. Skeleton yang benar
dibangun di Issue #14.

> Deep link (`/settings` diketik langsung di address bar) berfungsi di
> `npm run dev` dan `npm run preview` karena keduanya sudah punya SPA
> fallback. Hosting statis produksi perlu diarahkan ke `index.html` juga —
> dibereskan di Issue #17.

## Layout

> Status: **terpasang** · Issue #6

Tiga kerangka halaman, dipilih lewat field `layout` di tabel route:

| Layout | Dipakai             | Isi                                   |
| ------ | ------------------- | ------------------------------------- |
| `app`  | halaman terproteksi | sidebar + header + area konten        |
| `auth` | halaman login       | kartu di tengah layar, tanpa navigasi |
| `bare` | halaman 404         | konten polos, tanpa navigasi          |

**Sidebar responsif.** Yang menentukan bentuknya adalah CSS breakpoint, bukan
JavaScript — tidak ada `useMediaQuery`, jadi tidak ada kedipan saat render
pertama dan mengubah ukuran jendela tidak memicu render ulang.

| Lebar layar | Sidebar                                                                                                                                                                 |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `< md`      | di luar layar; tombol hamburger menggesernya masuk sebagai drawer dengan backdrop. Tertutup sendiri saat pindah halaman, saat backdrop diklik, atau saat Escape ditekan |
| `≥ md`      | selalu tampak. Tombol di header menciutkannya jadi rel ikon selebar `4rem`; pilihan itu disimpan di localStorage                                                        |

Label menu disembunyikan lewat `md:hidden`, bukan dilepas dari DOM — dengan
begitu rel ikon di desktop tetap ringkas sementara drawer di mobile tetap
menampilkan teksnya.

**Judul halaman** diambil `useCurrentRoute()` dari tabel route, bukan dikirim
sebagai prop oleh tiap halaman. Sumbernya sama dengan label sidebar dan
`document.title`, jadi ketiganya tidak mungkin berbeda — dan halaman tidak
perlu menulis `<h1>` sendiri.

## Design system

> Status: **terpasang** · Issue #7 · `src/components/ui/`

Tiga belas komponen dasar: `Button`, `Input`, `Select`, `Card`, `Badge`,
`Modal`, `Table`, `Tabs`, `Toast`, `Spinner`, `EmptyState`, `ErrorState`,
`Pagination`. Katalog lengkapnya ada di **`/dev/ui`** — hanya terdaftar saat
`npm run dev`.

**Varian dikelola satu tabel**, bukan `if` bertingkat di JSX. Tabelnya ditulis
dengan `cva`, dan tipe prop-nya diturunkan dari tabel itu lewat `VariantProps`
— menambah varian cukup satu baris, tanpa menyentuh tipe:

```tsx
<Button variant="danger" size="lg" loading>Hapus</Button>
<Badge tone="success" dot>passed</Badge>
```

**`className` selalu menang.** Semua komponen menggabungkan kelas lewat
`cn()` (`src/utils/cn.ts`), yang memakai `tailwind-merge`. Tanpa itu,
`<Button className="px-8">` hanya menghasilkan `px-4 px-8` dan yang menang
ditentukan urutan di file CSS, bukan niat pemanggil.

**Tautan yang tampil sebagai tombol** memakai tabel varian yang sama, bukan
kelas yang diketik ulang:

```tsx
<Link to={ROUTES.settings} className={buttonVariants({ variant: 'secondary' })}>
  Lihat konfigurasi
</Link>
```

**Belum ada library headless.** `Modal` dibangun di atas `<dialog>` +
`showModal()` bawaan browser, yang sudah memberi focus trap sungguhan,
Escape, dan top layer tanpa perang `z-index`. `Select` memakai `<select>`
bawaan, yang benar soal keyboard, screen reader, dan pemilih native di
mobile. Library headless baru layak ditambah kalau nanti butuh combobox atau
menu bertingkat — dan kedua komponen di atas tidak perlu ikut berubah.

**Kolom tabel adalah data**, bukan JSX, sehingga tabel di seluruh aplikasi
tidak menyimpang satu sama lain:

```tsx
const COLUMNS: TableColumn<Deployment>[] = [
  { key: 'service', header: 'Service', render: (row) => row.service },
  {
    key: 'status',
    header: 'Status',
    render: (row) => <Badge tone={row.status}>{row.status}</Badge>,
  },
]
```

## Lapisan data

> Status: **terpasang** · Issue #8 · `src/services/`

Alirannya satu arah, tanpa jalan pintas:

```
komponen  →  hook query  →  service domain  →  http client  →  fetch
             (*.queries)     (*.service)       (http.ts)      ↑
                                                              │
                                              mock transport ─┘  (VITE_USE_MOCK=true)
```

Komponen tidak pernah menyebut URL endpoint, tidak pernah memegang
`AbortController`, dan tidak pernah menyentuh `fetch`. Aturan itu bukan
konvensi tertulis melainkan gate: **`npm run check:layers`** gagal kalau ada
file di luar `src/services/` yang mengimpor `@/services/http.ts`.

### Mock dipasang di transport, bukan di service

Ini keputusan paling menentukan di lapisan ini. `VITE_USE_MOCK` **tidak**
memilih antara dua implementasi service:

```ts
// BUKAN begini — dua implementasi yang perlahan menyimpang
const service = env.useMock ? mockService : apiService
```

Yang diganti hanya fungsi `fetch` di dalam `http.ts`. Backend tiruan
(`src/services/mock/mock-transport.ts`) mencocokkan method + path lalu membalas
`Response` sungguhan, sehingga seluruh penanganan status, parsing, dan error di
`http.ts` tetap dilewati sama persis di kedua mode. Konsekuensinya: mematikan
flag mock tidak menjalankan satu baris kode pun yang belum pernah dijalankan.

Modulnya dimuat lewat `import()` dinamis, jadi data tiruan berakhir di chunk
terpisah dan tidak pernah diminta browser saat flag-nya mati.

Mock juga sengaja menunda balasan ~320 ms. Tanpa jeda itu setiap request selesai
di microtask yang sama dan keadaan "memuat" tidak pernah sempat terlihat —
spinner jadi tidak teruji sampai hari backend sungguhan dipasang.

### Empat keadaan, secara struktural

`<QueryState>` (`src/components/QueryState.tsx`) menerjemahkan satu query jadi
salah satu dari memuat, gagal, kosong, atau berisi. Halaman tidak menulis satu
`if` pun:

```tsx
<QueryState
  query={activities}
  isEmpty={(data) => data.items.length === 0}
  empty={<EmptyState title="Belum ada aktivitas" />}
>
  {(data) => <Table columns={COLUMNS} rows={data.items} rowKey={(r) => r.id} />}
</QueryState>
```

Saat data lama disegarkan, isinya tetap di tempat — diredupkan dan ditandai
`aria-busy`, bukan diganti spinner yang membuang isi layar.

### Error punya satu bentuk

`fetch` melempar `TypeError`, timeout melempar `DOMException`, backend membalas
JSON, proxy yang salah membalas HTML. Empat bentuk untuk satu konsep. `http.ts`
menormalkan semuanya jadi `ApiError` dengan `kind`, `status`, dan `message` yang
sudah berbahasa Indonesia dan layak ditampilkan apa adanya.

`ApiError.retryable` yang memutuskan apakah TanStack Query mengulang: 4xx tidak
diulang (permintaan yang sama akan ditolak dengan alasan yang sama), 5xx dan
gangguan jaringan diulang. Aturannya hanya ada di satu tempat.

Tipe error-nya didaftarkan global lewat module augmentation di
`query-client.ts`, jadi `query.error` sudah bertipe `ApiError` di semua komponen
tanpa satu generic pun ditulis manual.

### Menambah domain baru

1. `src/services/<domain>/<domain>.types.ts` — kontrak data.
2. `<domain>.service.ts` — path endpoint, satu-satunya tempat URL disebut.
3. `<domain>.queries.ts` — query key + hook yang dipakai komponen.
4. `<domain>.mock.ts` — handler tiruan, lalu sambungkan di
   `src/services/mock/routes.ts`.

Mock dan service mengetik dari file `types.ts` yang sama, jadi data tiruan yang
menyimpang dari kontrak gagal saat `npm run typecheck`.

### Token & CORS

Token hidup di memori (`src/services/auth-token.ts`), bukan di localStorage:
apa pun yang tersimpan di sana terbaca skrip mana pun yang berhasil masuk ke
halaman. Lapisan auth **menulis**, lapisan HTTP **membaca** — arah itu dijaga
`check:layers` juga.

Karena header `Authorization` membuat request jadi non-simple, backend di origin
berbeda **wajib** menjawab preflight `OPTIONS` dengan
`Access-Control-Allow-Headers: Authorization`. Tanpa itu request tidak pernah
terkirim dan gejalanya menyesatkan: halaman menggantung di keadaan memuat tanpa
satu pun request terlihat di log server.

## Konfigurasi environment

`env.defaults.ts` adalah **satu-satunya** tempat variabel environment
didaftarkan. Dari file itu diturunkan: nilai runtime beserta tipenya
(`src/config/env.ts`), tipe `import.meta.env` (`src/vite-env.d.ts`),
substitusi `%VITE_*%` di `index.html` (`vite.config.ts`), dan isi
`.env.example` (`scripts/env-example.ts`).

Menambah variabel baru:

1. Tambah satu entri di `ENV_SCHEMA` pada `env.defaults.ts`.
2. Jalankan `npm run env:example`.

Selesai — properti barunya langsung muncul di `env` lengkap dengan tipe yang
benar. Jangan menulis daftar variabel di tempat lain.

Membaca nilainya:

```ts
import { env } from '@/config/env.ts'

env.appName // string
env.apiTimeout // number
env.useMock // boolean
```

Komponen, hook, dan service **tidak boleh** menyentuh `import.meta.env`
langsung — hanya `src/config/env.ts` yang boleh.

> Seluruh variabel `VITE_*` terbundel ke JavaScript sisi klien dan bisa dibaca
> siapa pun. Jangan pernah menaruh secret di sana.

Variabel saat ini:

| Key                 | Tipe    | Default       | Untuk                             |
| ------------------- | ------- | ------------- | --------------------------------- |
| `VITE_APP_NAME`     | string  | `AIO DevOps`  | `<title>` + header layout         |
| `VITE_APP_ENV`      | string  | `development` | Label lingkungan                  |
| `VITE_DEV_PORT`     | number  | `3000`        | Port `npm run dev`                |
| `VITE_API_BASE_URL` | string  | `/api`        | Base URL backend (Issue #8)       |
| `VITE_API_TIMEOUT`  | number  | `15000`       | Timeout request (Issue #8)        |
| `VITE_USE_MOCK`     | boolean | `true`        | Switch mock ↔ API asli (Issue #8) |

## Struktur

```
aio-devops/
├── public/              aset statis, disalin apa adanya
├── scripts/             utilitas dev (dijalankan langsung oleh Node)
├── src/
│   ├── assets/          gambar & ikon yang di-import
│   ├── components/      komponen lintas halaman
│   │   └── ui/          design system: Button, Table, Modal, …
│   ├── config/          konfigurasi runtime (env)
│   ├── features/        logika per domain (auth, dst.)
│   ├── layouts/         kerangka halaman + sidebar, header, menu pengguna
│   ├── pages/           satu file per route, di-load lewat lazy()
│   ├── routes/          routes.ts (sumber tunggal) + router, guard, fallback
│   ├── services/        lapisan data
│   │   ├── dashboard/   satu folder per domain: types, service, queries, mock
│   │   ├── mock/        backend tiruan (transport + daftar route)
│   │   ├── http.ts      satu-satunya pemanggil fetch di aplikasi
│   │   ├── api-error.ts bentuk error tunggal
│   │   └── query-client.ts  kebijakan cache & retry TanStack Query
│   ├── utils/           helper murni tanpa React (cn, page-items)
│   ├── App.tsx          provider global lalu <RouterProvider>
│   ├── index.css        satu-satunya CSS: direktif Tailwind + design token
│   ├── main.tsx
│   └── vite-env.d.ts
├── .editorconfig        sumber indentasi, EOL, lebar baris (dibaca Prettier)
├── .oxlintrc.json       konfigurasi linter
├── env.defaults.ts      sumber tunggal variabel environment
├── tsconfig.json        termasuk sumber tunggal path alias `@/`
└── vite.config.ts
```

Direktori sisanya (`hooks/`, `store/`) menyusul di Issue #9. Rinciannya di
`ISSUES.md`.
