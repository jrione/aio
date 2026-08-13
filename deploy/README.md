# Menyajikan hasil build

Hasil `npm run build` adalah berkas statis di `dist/`. Server apa pun bisa
menyajikannya — tapi ada **satu aturan** yang kalau terlewat membuat aplikasi
tampak rusak dengan cara yang menyesatkan.

## Aturannya

> Setiap permintaan yang tidak cocok dengan berkas nyata harus dibalas
> `index.html` dengan status **200** — **kecuali** yang berada di bawah
> `/assets/`, yang harus dibalas **404** apa adanya.

Bagian pertama sudah umum diketahui. Bagian keduanya yang sering terlewat, dan
akibatnya jauh lebih membingungkan.

### Kenapa bagian pertama

Route seperti `/settings` dan `/deployments/dep-004` hanya ada di dalam React
Router; di disk tidak ada direktori bernama itu. Tanpa fallback, menekan F5 di
halaman mana pun selain `/` menghasilkan 404 dari server — aplikasinya tidak
pernah sempat berjalan untuk menjelaskan dirinya. Begitu pula setiap tautan yang
dibagikan ke orang lain.

Statusnya tetap **200**, dan itu memang benar: URL-nya sah, yang menentukan
isinya adalah router di sisi klien. Halaman 404 sungguhan dirender aplikasi
sendiri lewat route `*`.

### Kenapa bagian kedua

Kalau fallback berlaku juga untuk `/assets/`, chunk yang sudah tidak ada dibalas
`index.html` dengan status 200. Browser lalu mencoba mengurai HTML sebagai
JavaScript dan melempar:

```
Uncaught SyntaxError: Unexpected token '<'
```

Pesan itu tidak menyebut-nyebut konfigurasi server sama sekali, dan menunjuk
berkas yang tidak pernah ditulis siapa pun. Dengan 404 yang sejujurnya, aplikasi
menangkapnya sebagai kegagalan memuat chunk dan menawarkan "muat ulang halaman" —
lihat `src/components/CrashFallback.tsx`.

## Cache

| Berkas        | Header                                | Alasan                                                                                   |
| ------------- | ------------------------------------- | ---------------------------------------------------------------------------------------- |
| `/assets/*`   | `public, max-age=31536000, immutable` | Namanya mengandung hash isi; isi berubah = nama berubah                                  |
| `/index.html` | `no-cache, must-revalidate`           | Satu-satunya berkas tanpa hash, dan isinya menunjuk nama chunk yang berganti tiap deploy |

`index.html` yang di-cache adalah penyebab paling umum dari "aplikasinya rusak
setelah deploy": browser memakai HTML lama, meminta chunk yang sudah dihapus, dan
gagal terus sampai cache-nya kedaluwarsa.

## Nginx

Konfigurasi lengkapnya ada di [`nginx.conf`](./nginx.conf), sudah dipakai
`Dockerfile` di root repositori.

```bash
docker build -t aio-devops .
docker run --rm -p 8080:8080 aio-devops
```

Seluruh `VITE_*` dibaca **saat build**, bukan saat container berjalan:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=https://api.contoh.id \
  --build-arg VITE_APP_ENV=production \
  --build-arg VITE_USE_MOCK=false \
  -t aio-devops:production .
```

Satu image = satu konfigurasi lingkungan. Alasannya, beserta jalan keluar bila
kelak satu image harus melayani banyak lingkungan, ada di komentar `Dockerfile`.

## Host lain

Aturan yang sama, sintaks berbeda.

**Caddy**

```caddyfile
contoh.id {
  root * /srv/dist
  encode gzip

  @assets path /assets/*
  header @assets Cache-Control "public, max-age=31536000, immutable"
  header /index.html Cache-Control "no-cache, must-revalidate"

  # file_server melayani berkas nyata; try_files mengembalikan sisanya
  # ke index.html. `/assets/*` tidak ikut karena sudah cocok di atas.
  try_files {path} /index.html
  file_server
}
```

**Netlify** — `public/_redirects` (ikut tersalin ke `dist/`):

```
/assets/*  /assets/:splat  404
/*         /index.html     200
```

Baris pertama harus di atas; Netlify memakai aturan pertama yang cocok.

**Vercel** — `vercel.json`:

```json
{
  "rewrites": [{ "source": "/((?!assets/).*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

**Apache** — `.htaccess` di root:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^assets/ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

**S3 + CloudFront** — jangan memakai "error document = index.html": itu membalas
`index.html` untuk **semua** 404, termasuk aset, yaitu persis yang dilarang di
atas. Pakai CloudFront Function atau Lambda@Edge yang menulis ulang hanya
permintaan non-aset.

## Memeriksa sendiri

Setelah menyajikannya di mana pun, tiga perintah ini cukup:

```bash
curl -o /dev/null -w '%{http_code}\n' http://host/settings          # harus 200
curl -o /dev/null -w '%{http_code}\n' http://host/assets/hilang.js  # harus 404
curl -sI http://host/index.html | grep -i cache-control             # harus no-cache
```

Yang kedua adalah yang paling sering keliru, dan satu-satunya yang tidak akan
ketahuan sampai deploy berikutnya.
