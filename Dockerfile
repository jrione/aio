# Image produksi: build dengan Node, sajikan dengan nginx.
#
# Dua tahap, dan tahap kedua tidak membawa satu pun jejak tahap pertama —
# tidak ada Node, tidak ada node_modules, tidak ada source. Yang dikirim ke
# server hanyalah berkas statis hasil build beserta nginx yang menyajikannya.

# ── Tahap 1: build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS build

WORKDIR /app

# package*.json disalin lebih dulu, terpisah dari source. Selama daftar
# dependency tidak berubah, layer `npm ci` diambil dari cache — dan itulah
# bagian paling lama dari seluruh build.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# PENTING: seluruh VITE_* dibaca saat BUILD, bukan saat container berjalan.
# Nilainya ikut terbundel ke JavaScript yang dikirim ke browser, jadi:
#
#   1. satu image = satu konfigurasi lingkungan. Image staging dan production
#      adalah dua image berbeda, dibangun dengan --build-arg berbeda;
#   2. jangan pernah menaruh secret di sini. Nilainya bisa dibaca siapa pun
#      yang membuka devtools, dan juga siapa pun yang punya image-nya.
#
# Kalau kelak satu image harus melayani banyak lingkungan, jalannya bukan
# menambah variabel di sini melainkan menyuntikkan konfigurasi saat runtime
# (mis. `/config.json` yang diambil aplikasi sebelum render pertama). Itu
# keputusan tersendiri, bukan penyesuaian kecil.
ARG VITE_APP_NAME
ARG VITE_APP_ENV=production
ARG VITE_API_BASE_URL=/api
ARG VITE_API_TIMEOUT
ARG VITE_USE_MOCK=false

RUN npm run build

# Anggaran bundle diperiksa di dalam build image, bukan hanya di CI. Dengan
# begitu image yang kelewat besar tidak pernah sempat jadi.
RUN npm run check:bundle

# ── Tahap 2: sajikan ────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS serve

COPY deploy/nginx.conf            /etc/nginx/conf.d/default.conf
COPY deploy/security-headers.conf /etc/nginx/conf.d/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html

# Port tak-berhak-istimewa supaya container bisa jalan sebagai non-root di
# platform yang melarang root (OpenShift, sebagian setelan Kubernetes).
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/ || exit 1
