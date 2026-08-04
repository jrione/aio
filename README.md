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
npm run dev            # http://localhost:5173
```

## Script npm

| Script                 | Fungsi                                           |
| ---------------------- | ------------------------------------------------ |
| `npm run dev`          | Dev server + HMR                                 |
| `npm run build`        | Type check lalu build produksi ke `dist/`        |
| `npm run preview`      | Serve hasil build secara lokal                   |
| `npm run typecheck`    | `tsc --noEmit` saja                              |
| `npm run lint`         | oxlint (ESLint diputuskan di Issue #4)           |
| `npm run format`       | Prettier, tulis perubahan                        |
| `npm run format:check` | Prettier, hanya cek                              |
| `npm run env:example`  | Regenerate `.env.example` dari `env.defaults.ts` |
| `npm run env:check`    | Gagal bila `.env.example` tidak sinkron          |
| `npm run check:lang`   | Gagal bila ada file JavaScript di source tree    |

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
import { env } from './config/env.ts'

env.appName // string
env.apiTimeout // number
env.useMock // boolean
```

Impor memakai path relatif dengan ekstensi `.ts` eksplisit. Alias `@/` → `src/`
dipasang di Issue #4.

Komponen, hook, dan service **tidak boleh** menyentuh `import.meta.env`
langsung — hanya `src/config/env.ts` yang boleh.

> Seluruh variabel `VITE_*` terbundel ke JavaScript sisi klien dan bisa dibaca
> siapa pun. Jangan pernah menaruh secret di sana.

Variabel saat ini:

| Key                 | Tipe    | Default       | Untuk                             |
| ------------------- | ------- | ------------- | --------------------------------- |
| `VITE_APP_NAME`     | string  | `AIO DevOps`  | `<title>` + header layout         |
| `VITE_APP_ENV`      | string  | `development` | Label lingkungan                  |
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
│   ├── config/          konfigurasi runtime (env)
│   ├── App.tsx
│   ├── main.tsx
│   └── vite-env.d.ts
├── env.defaults.ts      sumber tunggal variabel environment
├── tsconfig.json
└── vite.config.ts
```

Struktur target berbasis fitur (`components/`, `layouts/`, `features/`,
`routes/`, `services/`, `hooks/`, `store/`, `utils/`) dibangun bertahap mulai
Issue #5. Rinciannya di `ISSUES.md`.
