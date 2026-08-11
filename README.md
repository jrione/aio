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
  `BRAND_SWATCHES` di `src/App.tsx`.

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
dan Vite mendapatkannya lewat plugin `vite-tsconfig-paths`. Tidak ada daftar
alias kedua di `vite.config.ts`.

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
  title: 'Settings',
  nav: true,
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
│   ├── components/      komponen UI yang dipakai lintas halaman
│   ├── config/          konfigurasi runtime (env)
│   ├── features/        logika per domain (auth, dst.)
│   ├── layouts/         kerangka halaman: AppLayout, AuthLayout, BareLayout
│   ├── pages/           satu file per route, di-load lewat lazy()
│   ├── routes/          routes.ts (sumber tunggal) + router, guard, fallback
│   ├── App.tsx          hanya memasang <RouterProvider>
│   ├── index.css        satu-satunya CSS: direktif Tailwind + design token
│   ├── main.tsx
│   └── vite-env.d.ts
├── .editorconfig        sumber indentasi, EOL, lebar baris (dibaca Prettier)
├── .oxlintrc.json       konfigurasi linter
├── env.defaults.ts      sumber tunggal variabel environment
├── tsconfig.json        termasuk sumber tunggal path alias `@/`
└── vite.config.ts
```

Direktori sisanya (`services/`, `hooks/`, `store/`, `utils/`) menyusul di
Issue #8 dan #9. Rinciannya di `ISSUES.md`.
