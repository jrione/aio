# RBAC: keputusan & penyesuaian

Dokumen anak dari [`rbac-keycloak-jenkins.md`](./rbac-keycloak-jenkins.md).
Berisi jawaban atas sepuluh pertanyaan terbuka di sana, sembilan pertanyaan
lanjutan yang muncul darinya, beserta penyesuaian yang ditimbulkannya.

Dokumen induknya **tidak ditimpa**. Yang berlaku adalah induk + dokumen ini;
bila keduanya berselisih, yang di sini yang menang.

---

## Daftar isi

1. [Jawaban](#1-jawaban)
2. [Empat perubahan struktural](#2-empat-perubahan-struktural)
3. [Lingkup dua sumbu](#3-lingkup-dua-sumbu)
4. [Katalog: instance & kelompok job](#4-katalog-instance--kelompok-job)
5. [Katalog peran yang direvisi](#5-katalog-peran-yang-direvisi)
6. [Matriks jadi preset, bukan definisi](#6-matriks-jadi-preset-bukan-definisi)
7. [Kredensial & isolasi untuk banyak instance](#7-kredensial--isolasi-untuk-banyak-instance)
8. [Keycloak ↔ Jenkins: satu katalog, dua penegak](#8-keycloak--jenkins-satu-katalog-dua-penegak)
9. [Batas lingkup: mengelola, bukan menggerbang](#9-batas-lingkup-mengelola-bukan-menggerbang)
10. [Yang diparkir](#10-yang-diparkir)
11. [Pertanyaan lanjutan](#11-pertanyaan-lanjutan)

---

## 1. Jawaban

| #   | Pertanyaan                             | Jawaban                                                                                       |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Izin berlingkup layanan?               | **Ya.** Berlapis: dari akses job spesifik yang dikelompokkan, sampai akses seluruh lingkungan |
| 2   | `staging` hilang atau di samping `qa`? | **`qa` adalah nama untuk `staging`.** Tetap empat lingkungan                                  |
| 3   | Satu Jenkins atau banyak?              | **Lima Jenkins, bisa bertambah.** Peran global lintas-instance + peran spesifik per job       |
| 4   | Developer boleh rilis ke QA?           | **Tidak; developer cukup development.** Tapi peran harus bisa dipasang-lepas                  |
| 5   | Berapa lama persetujuan berlaku?       | **Di luar lingkup.** Alat ini mengelola akses, tidak menggerbang tindakan                     |
| 6   | `params` di produksi dibutuhkan?       | **Tidak.** Diparkir untuk kemungkinan nanti                                                   |
| 7   | Siapa boleh break-glass?               | **Di luar lingkup**, seperti #5                                                               |
| 8   | Role Strategy plugin terpasang?        | **Ya**, dan peran Keycloak dipakai langsung sebagai authority-nya                             |
| 9   | Peran dari grup atau tersinkron SDM?   | **Terhubung Keycloak**                                                                        |
| 10  | EA butuh tulis di sandbox?             | **Cukup readonly.** Bisa ditambah nanti                                                       |

Jawaban atas pertanyaan lanjutan ada di [bagian 11](#11-pertanyaan-lanjutan);
dampaknya sudah ditulis langsung ke bagian-bagian di bawah, bukan ditumpuk
sebagai lapisan koreksi ketiga.

---

## 2. Empat perubahan struktural

Enam dari sepuluh jawaban di atas menyederhanakan rancangan. Empat sisanya —
nomor 1, 2, 3, dan 8 — mengubah bentuknya.

### 2.1 Lingkup jadi dua sumbu (jawaban #1, #3)

Induk memakai satu sumbu: **lingkungan**. Sekarang ada dua yang berdiri sendiri:

- **lingkungan** — development, qa, sandbox, production
- **kelompok job** — sekumpulan pipeline yang boleh disentuh, mungkin lintas
  instance Jenkins

Keduanya **bukan hierarki**. Seseorang bisa punya akses baca seluruh lingkungan
development sekaligus akses rilis pada satu kelompok job tertentu di production.
Rinciannya di [bagian 3](#3-lingkup-dua-sumbu).

### 2.2 Banyak instance Jenkins (jawaban #3)

Induk mengasumsikan satu instance dengan folder per lingkungan. Kenyataannya
lima, dan bisa bertambah.

Yang perlu ditambahkan cuma entitas `JenkinsInstance` di katalog. Kelima
instance ternyata sudah memakai konvensi folder yang sama dan punya keempat
lingkungan (jawaban lanjutan #1 dan #8), jadi lingkungan sebuah job diturunkan
dengan satu aturan untuk semua instance: **segmen pertama path-nya.**

Yang **tidak** berubah: peran tidak perlu menyebut instance. "Akses development
saja" berlaku di kelima Jenkins sekaligus, persis seperti yang diminta. Dan
"akses seluruh Jenkins-A" pun tidak butuh mekanisme baru — ia cukup sebuah
kelompok job yang isinya seluruh job di instance itu.

### 2.3 `qa` adalah `staging` (jawaban #2)

Ini mengubah **alasan** di balik matriks, meski hasilnya hampir sama.

Induk beralasan: "QA milik tim penguji, developer yang menimpanya membatalkan
siklus pengujian." Kalau `qa` sebenarnya staging, alasannya berbeda dan lebih
kuat: **staging adalah gerbang terakhir sebelum produksi.** Isinya harus persis
yang akan dirilis; siapa pun yang bisa menimpanya di luar jalur promosi membuat
verifikasi akhir jadi tidak berarti.

Konsekuensi pertama: jalur promosi jadi wajar dan wajib dideklarasikan —
sekaligus menambal celah di induk (`promote` tidak pernah menyebut "dari mana"):

```
sandbox      → (buntu, sengaja)
development  → qa
qa           → production
```

`promote:production` berarti "promosikan **dari qa**", bukan "dari mana saja".
Tanpa deklarasi ini, model induk diam-diam mengizinkan sandbox → production.

Konsekuensi kedua, yang baru terlihat saat membahas kredensial: **konfigurasi
pipeline qa juga tidak boleh diubah di luar repositori**, sama seperti produksi.
Staging yang konfigurasinya bisa diubah lewat UI bukan lagi cermin produksi.
Karena itu qa mendapat plafon tingkat `release` yang sama dengan produksi
(jawaban lanjutan #9) — rinciannya di [bagian 5.3](#53-plafon-tingkat-per-lingkungan).

### 2.4 Jenkins ikut membaca peran Keycloak (jawaban #8)

Induk memperlakukan RBAC platform dan izin folder Jenkins sebagai dua daftar
terpisah yang harus disamakan manual. Karena peran Keycloak bisa dipakai langsung
sebagai authority di Jenkins, keduanya jadi turunan dari satu katalog — dan
risiko menyimpang itu hilang, bukan sekadar dikurangi.
Rinciannya di [bagian 8](#8-keycloak--jenkins-satu-katalog-dua-penegak).

---

## 3. Lingkup dua sumbu

### 3.1 Bentuk peran atomik

Dua keluarga, dibedakan oleh jenis lingkupnya:

```
jenkins:<kapabilitas>:env:<lingkungan>      ← berlaku di SEMUA instance
jenkins:<kapabilitas>:group:<kelompok>      ← hanya job di kelompok itu
```

Contoh:

```
jenkins:read:env:development        baca semua job development, di kelima Jenkins
jenkins:trigger:env:development     jalankan semua job development
jenkins:read:group:payments         baca job kelompok payments, di lingkungan mana pun
jenkins:promote:group:payments      promosikan job kelompok payments
```

### 3.2 Aturan keputusan

Seorang aktor boleh menjalankan kapabilitas `C` pada job `J` bila `C` tidak
melampaui plafon `lingkungan(J)` ([bagian 5.3](#53-plafon-tingkat-per-lingkungan)),
**dan** salah satu terpenuhi:

```
punya  jenkins:C:env:<lingkungan(J)>
atau   punya  jenkins:C:group:<G>  untuk suatu G yang memuat J,
              dan lingkungan(J) ada di G.environments (bila diisi)
```

**Penggabungan, bukan pengurangan.** Hibah menumpuk; tidak ada aturan "tolak".
Itu keputusan sadar: begitu ada aturan penolakan, urutan evaluasi jadi penting,
dan "kenapa saya tidak bisa" berubah dari pertanyaan satu langkah jadi
penelusuran. Bila seseorang tidak boleh menyentuh sesuatu, caranya adalah tidak
memberinya hibah — bukan memberinya lalu mencabutnya di tempat lain.

Plafon bukan pengecualian dari aturan itu. Ia bukan hibah yang dicabut,
melainkan batas yang tidak bisa dihibahkan sama sekali — tidak ada peran yang
bisa memberi `configure` di production, jadi tidak ada urutan yang perlu
dievaluasi.

Karena satu job boleh masuk lebih dari satu kelompok (jawaban lanjutan #4),
penggabungan ini juga berlaku lintas kelompok: hibah dari `payments` dan dari
`semua-batch` atas job yang sama menumpuk, tidak saling membatasi.

**Bawaannya menolak.** Job yang tidak masuk kelompok mana pun hanya terjangkau
lewat peran tingkat lingkungan. Job baru karena itu tidak pernah otomatis
terbuka bagi pemegang akses kelompok. Job yang segmen pertamanya bukan salah satu
dari empat id lingkungan tidak punya lingkungan, dan ditolak bagi semua orang
([bagian 4.1](#41-jenkinsinstance)).

### 3.3 Kenapa lingkungan bukan bagian dari kelompok

Godaannya menyatukan keduanya: kelompok `payments-production`,
`payments-development`, dan seterusnya. Itu mengembalikan ledakan kombinasi yang
justru dihindari — N kelompok × 4 lingkungan × 4 tingkat.

Dengan dua sumbu terpisah, kelompok menjawab **"job yang mana"** dan lingkungan
menjawab **"tahap yang mana"**. Keduanya dikombinasikan saat memutuskan, bukan
saat mendefinisikan.

Kalau memang perlu "rilis payments **hanya** di production", itu diungkapkan
sebagai kelompok `payments` + tingkat `release`, ditambah pembatasan lingkungan
pada kelompoknya sendiri (`environments: ['production']` di katalog) — satu
properti, bukan satu kelompok baru per lingkungan.

### 3.4 Pembagian tanggung jawab: Keycloak vs katalog

Ini pemisahan yang paling menentukan apakah model ini bisa dirawat.

|                      | Isinya                                | Siapa yang mengubah | Seberapa sering                    |
| -------------------- | ------------------------------------- | ------------------- | ---------------------------------- |
| **Keycloak**         | Siapa memegang hibah apa              | Admin identitas     | Saat orang bergabung/pindah/keluar |
| **Katalog platform** | Kelompok `payments` itu job yang mana | DevOps              | Setiap ada pipeline baru           |

Kalau isi kelompok ditaruh di Keycloak, setiap penambahan pipeline menuntut
admin identitas menyunting realm — dan pekerjaan yang salah tempat itu akan
dilewati dengan memberi akses yang lebih luas daripada yang dibutuhkan, karena
itu lebih cepat.

Keycloak menyimpan **nama** kelompok; katalog menyimpan **isinya**.

---

## 4. Katalog: instance & kelompok job

### 4.1 `JenkinsInstance`

```
JenkinsInstance {
  id           'jenkins-core'
  name         'Jenkins Core'
  baseUrl      'https://jenkins-core.internal'
  credentials  { nonProduction: 'cred-core-nonprod', production: 'cred-core-prod' }
  casc         { reloadToken: 'casc-core-reload' }
}
```

Bentuk ini lebih kecil dari usulan sebelumnya, dan itu karena dua jawaban
lanjutan:

- **Tidak ada `environmentFrom`.** Kelima instance memakai
  `/<lingkungan>/<aplikasi>/<pipeline>` (jawaban lanjutan #1). Lingkungan sebuah
  job adalah segmen pertama path-nya, di instance mana pun. Strategi
  `job-suffix` dan `label` yang sempat dirancang tidak dibuat — diparkir di
  [bagian 10](#10-yang-diparkir) untuk instance yang kelak menyimpang.
- **Tidak ada `environments`.** Kelimanya punya keempat lingkungan (jawaban
  lanjutan #8), jadi daftar itu akan sama di setiap entri.

Segmen pertama yang bukan salah satu dari empat id lingkungan — `/prod/…`,
`/shared/…`, job di akar — membuat job itu **tidak punya lingkungan**. Job seperti
itu ditolak bagi semua orang dan ditampilkan sebagai anomali di katalog. Itu
sejalan dengan Jenkins sendiri: kredensial platform pun tidak punya izin di
luar empat folder lingkungan ([bagian 7](#7-kredensial--isolasi-untuk-banyak-instance)).

**Instance keenam masuk sebagai data, bukan kode** (jawaban lanjutan #7). Per
hari ini `src/` belum menyebut Jenkins sama sekali, dan aturannya adalah tetap
begitu: tidak ada id instance di kode. Menambah instance berarti:

1. Satu entri `JenkinsInstance` di katalog platform.
2. Satu client OIDC di Keycloak, dibangkitkan dari daftar instance yang sama
   lewat Terraform ([induk bagian 14](./rbac-keycloak-jenkins.md#14-konfigurasi-sebagai-kode)),
   bukan diketik ulang.
3. Pemasangan di sisi Jenkins: `oic-auth`, dua akun layanan, dan token reload
   JCasC ([bagian 8.5](#85-konfigurasi-jenkins-dibangkitkan-bukan-diketik)).

Tidak satu pun langkah itu menyunting kode platform.

### 4.2 `JobGroup`

```
JobGroup {
  id            'payments'
  name          'Payments'
  environments  ['development', 'qa', 'production']   // opsional; kosong = semua
  members: [
    { instance: 'jenkins-core',  pattern: '/*/payments/**' },
    { instance: 'jenkins-batch', pattern: '/*/payment-recon/**' },
  ]
}
```

**Satu kelompok = satu aplikasi** (jawaban lanjutan #2). Nama kelompok mengikuti
nama aplikasi, bukan nama tim. Reorganisasi mengubah _siapa_ memegang
`jenkins-group-payments-*` di Keycloak, tapi tidak mengubah _isi_ kelompok
`payments` — dan isi kelompok adalah bagian yang paling mahal untuk diperiksa
ulang. Sebuah tim yang mengurus tiga aplikasi mendapat tiga hibah kelompok; itu
lebih banyak baris, tapi setiap barisnya tetap benar setelah tim itu dipecah.

Sebuah kelompok **boleh melintasi instance** — itu justru gunanya, karena satu
aplikasi bisa punya pipeline build di satu Jenkins dan pipeline batch di
Jenkins lain.

Kelompok lintas aplikasi (mis. `semua-batch`) tetap boleh dibuat sebagai
pengecualian, karena satu job boleh masuk lebih dari satu kelompok (jawaban
lanjutan #4). Yang tidak boleh adalah menjadikannya kebiasaan: kelompok per
aplikasi adalah bawaannya, kelompok lintas aplikasi harus punya alasan.

Dua bentuk khusus yang tidak butuh mekanisme baru:

| Kebutuhan                   | Bentuknya                                                 |
| --------------------------- | --------------------------------------------------------- |
| Akses seluruh satu instance | `members: [{ instance: 'jenkins-batch', pattern: '**' }]` |
| Akses satu job tunggal      | `pattern: '/production/payments/deploy'`                  |

### 4.3 Yang harus dijaga soal pola

Pola adalah tempat kesalahan diam bersembunyi. Tiga aturan:

1. **Pola diuji saat disimpan, bukan saat dipakai.** Antarmuka katalog
   menampilkan daftar job yang cocok sebelum perubahan disimpan. Pola yang
   ternyata cocok dengan nol job hampir selalu salah ketik; pola yang cocok
   dengan tiga ratus job hampir selalu terlalu luas.
2. **Perubahan pola adalah perubahan hak akses**, dan dicatat di audit log
   dengan aksi tersendiri (`catalog.jobgroup.update`) beserta selisih job yang
   masuk dan keluar. Menyunting satu karakter di pola bisa memberi akses
   produksi kepada belasan orang tanpa satu pun peran berubah di Keycloak.
3. **Tumpang-tindih ditampilkan, bukan dilarang.** Saat menyimpan, katalog
   menandai job yang juga dimuat kelompok lain. Tumpang-tindih yang disengaja
   (`payments` + `semua-batch`) tidak apa-apa; yang tidak disengaja biasanya
   tanda pola yang terlalu luas.

Nomor dua adalah lubang paling berbahaya dalam model dua sumbu ini, dan
satu-satunya yang tidak terlihat dari sisi Keycloak sama sekali.

### 4.4 Siapa yang menyunting katalog

**DevOps** (jawaban lanjutan #3), lewat peran atomik `catalog:jobgroup:manage`
yang dimuat `role-devops` — bukan lewat pemeriksaan nama `role-devops` di kode
([induk bagian 2](./rbac-keycloak-jenkins.md#2-model-tiga-lapis), aturan 2).

Pilihan ini wajar karena satu alasan yang perlu ditulis: **DevOps sudah memegang
akses lingkungan terluas di setiap tahap** — `admin` di sandbox dan development,
`release` di qa dan production. Menyunting pola kelompok tidak pernah
memperluas akses DevOps sendiri; yang bisa diperluasnya adalah akses orang lain.

Jadi risikonya bukan eskalasi diri, melainkan kekeliruan — satu `*` di tempat
yang salah. Karena alat ini tidak menggerbang tindakan
([bagian 9](#9-batas-lingkup-mengelola-bukan-menggerbang)), penangkalnya ada di
tiga aturan 4.3 di atas, ditambah satu: perubahan yang **memperluas cakupan
produksi** sebuah kelompok ikut masuk peninjauan hibah berkala.

Kalau kelak tidak semua DevOps boleh menyunting katalog, cukup keluarkan
`catalog:jobgroup:manage` dari `role-devops` dan pasang terpisah — modelnya
tidak berubah.

---

## 5. Katalog peran yang direvisi

### 5.1 Tingkat akses

`params` keluar dari semua tingkat (jawaban #6). Tingkatnya jadi:

| Tingkat    | Kapabilitas             |
| ---------- | ----------------------- |
| `readonly` | `read`, `log`           |
| `operate`  | + `trigger`, `abort`    |
| `release`  | + `promote`             |
| `admin`    | + `configure`, `replay` |

`release` sekarang berarti tepat satu tambahan di atas `operate`: **memindahkan
artefak ke tahap berikutnya**. Itu justru mempertajam batas yang sudah jadi
batas terpenting di induk — `operate` menjalankan yang sudah ditentukan,
`release` menentukan apa yang masuk ke tahap berikutnya.

### 5.2 Jumlah peran

**Ejaan lingkungan di nama peran memakai id utuh** — `jenkins-production-release`,
bukan `jenkins-prod-release` seperti di induk. Pola item role Role Strategy
(`^production/.*`) dibangkitkan dari id yang sama, dan dua ejaan untuk satu
lingkungan adalah undangan untuk salah cocok.

| Keluarga            | Bentuk                                         | Jumlah             |
| ------------------- | ---------------------------------------------- | ------------------ |
| Atomik, lingkungan  | `jenkins:<cap>:env:<env>`                      | 8 × 4 − 4 = **28** |
| Atomik, kelompok    | `jenkins:<cap>:group:<g>`                      | 8 × N              |
| Atomik, global      | `jenkins:agent:manage`, `jenkins:queue:manage` | **2**              |
| Atomik, katalog     | `catalog:jobgroup:manage`                      | **1**              |
| Akses, lingkungan   | `jenkins-<env>-<tingkat>`                      | 4 × 4 − 2 = **14** |
| Akses, kelompok     | `jenkins-group-<g>-<tingkat>`                  | 4 × N              |
| Lintas              | `jenkins-agent-admin`, `jenkins-automation`    | **2**              |
| Preset fungsi kerja | `role-developer`, dst.                         | **5**              |

Pengurangan `− 4` dan `− 2` adalah plafon di bagian berikutnya: `configure` dan
`replay` tidak dibangkitkan untuk qa dan production, begitu pula
`jenkins-qa-admin` dan `jenkins-production-admin`.

`jenkins-prod-approve` dan `jenkins-breakglass` **dihapus** (jawaban #5 dan #7).

Peran per kelompok dibangkitkan otomatis saat kelompok dibuat — 12 peran per
kelompok (8 atomik + 4 komposit). Kelompok per aplikasi berarti N mengikuti
jumlah aplikasi; dengan 20 aplikasi itu 240 peran, dan itu tidak apa-apa selama
tidak ada manusia yang pernah mengetiknya. Lihat induk bagian 14.

### 5.3 Plafon tingkat per lingkungan

Induk mempertahankan `jenkins-prod-admin` sebagai peran yang **ada tapi tidak
diberikan**. Sekarang qa ikut di posisi yang sama (jawaban lanjutan #9), dan
"ada tapi jangan diberikan" untuk dua lingkungan adalah aturan yang hanya hidup
di ingatan orang. Penggantinya properti lingkungan di katalog:

```
Environment { id: 'sandbox',      maxLevel: 'admin'   }
Environment { id: 'development',  maxLevel: 'admin'   }
Environment { id: 'qa',           maxLevel: 'release' }
Environment { id: 'production',   maxLevel: 'release' }
```

Akibatnya:

- **Peran di atas plafon tidak dibangkitkan.** Peran yang tidak boleh diberikan
  tidak perlu ada — dan yang tidak ada tidak bisa diberikan karena keliru.
- **Hibah kelompok tetap dibangkitkan lengkap**, karena kelompok melintasi
  lingkungan. Plafon berlaku saat memutuskan: `jenkins-group-payments-admin`
  berarti `configure` di `sandbox/payments` dan `development/payments`, dan
  hanya sampai `release` di qa dan production.
- **Generator Role Strategy menerapkan plafon yang sama**, sehingga Jenkins dan
  platform tidak pernah berbeda pendapat
  ([bagian 8.2](#82-pemetaan-ke-role-based-authorization-strategy)).

Alasannya tidak berubah dari induk: `replay` adalah eksekusi kode arbitrer, dan
perubahan pipeline ditempuh lewat commit ke repositori Jenkinsfile — jalur yang
meninggalkan jejak review dan bisa digulirkan balik. Untuk qa alasannya kini
sama kuatnya dengan produksi ([bagian 2.3](#23-qa-adalah-staging-jawaban-2)).

Menghapus fitur persetujuan justru **menguatkan** plafon ini, bukan
melonggarkannya — lihat [bagian 9](#9-batas-lingkup-mengelola-bukan-menggerbang).

---

## 6. Matriks jadi preset, bukan definisi

Jawaban #4 dan #10 mengubah status matriks di induk bagian 7: ia sekarang
**nilai awal yang bisa disunting**, bukan definisi peran.

|                          | sandbox    | development | qa         | production | Kelompok job                 |
| ------------------------ | ---------- | ----------- | ---------- | ---------- | ---------------------------- |
| **Developer**            | `admin`    | `release`   | `readonly` | —          | ditambahkan sesuai kebutuhan |
| **QA Engineer**          | `admin`    | `readonly`  | `release`  | `readonly` | —                            |
| **Enterprise Architect** | `readonly` | `readonly`  | `readonly` | `readonly` | —                            |
| **DevOps**               | `admin`    | `admin`     | `release`  | `release`  | —                            |
| **IT Ops**               | `readonly` | `readonly`  | `readonly` | `release`  | —                            |

Ditambah di luar matriks: `role-devops` memuat `catalog:jobgroup:manage`
([bagian 4.4](#44-siapa-yang-menyunting-katalog)), dan `jenkins-agent-admin`
tetap untuk DevOps dan IT Ops.

Perubahan dari induk:

- Developer di production: `readonly` → **tidak ada** (jawaban #4: cukup
  development). Ditambahkan per orang bila memang perlu menelusuri produksi.
- EA: `prod-approve` dicabut (fiturnya hilang), sisanya `readonly` (jawaban #10).
- DevOps & IT Ops di production: tanda † hilang — tidak ada persetujuan lagi.
- DevOps di qa: `admin` → **`release`** (plafon qa, jawaban lanjutan #9).
  Konfigurasi pipeline qa tetap milik DevOps, tapi lewat repositori Jenkinsfile.

### Apa artinya "preset" bagi implementasi

Yang harus disediakan platform, dan ini kebutuhan fungsional baru dari jawaban #4:

1. **Terapkan preset** ke sebuah grup — memasang seluruh peran akses sekaligus.
2. **Pasang/lepas satu peran akses** pada grup atau perorangan, di luar preset.
3. **Tampilkan selisih terhadap preset** — "grup ini `role-developer` **plus**
   `jenkins-group-payments-release`".

Nomor tiga yang paling mudah dilewatkan dan paling dibutuhkan. Tanpa tampilan
selisih, dalam enam bulan tidak ada yang tahu lagi peran mana yang sengaja
ditambahkan dan mana yang tersisa dari percobaan yang lupa dibersihkan — dan
preset berhenti berarti apa pun.

> **Catatan.** Karena peran bisa dipasang-lepas bebas, katalog peran akses harus
> **lengkap dan ortogonal sampai plafon** — setiap kombinasi (lingkungan ×
> tingkat) sampai `maxLevel` lingkungannya, dan setiap (kelompok × tingkat),
> harus ada, termasuk yang tidak dipakai preset mana pun. Katalog yang hanya
> berisi kombinasi yang kebetulan terpakai akan memaksa pemberian akses yang
> lebih luas dari yang dimaksud, hanya karena yang tepat tidak tersedia.

---

## 7. Kredensial & isolasi untuk banyak instance

Prinsip induk bagian 9 tetap: satu bug otorisasi platform tidak boleh langsung
jadi deployment produksi. Yang berubah adalah aritmetikanya.

| Pilihan                                | Jumlah kredensial | Isolasi produksi | Beban rawat |
| -------------------------------------- | ----------------- | ---------------- | ----------- |
| Satu per instance                      | 5                 | ✗                | Ringan      |
| **Dua per instance** (non-prod / prod) | **10**            | **✓**            | Sedang      |
| Satu per (instance × lingkungan)       | 20                | ✓✓               | Berat       |

**Rekomendasi: dua per instance.** Produksi adalah satu-satunya batas yang
kesalahannya tidak bisa ditarik kembali; memisahkan development dari qa lewat
kredensial memberi tambahan kecil dengan biaya dua kali lipat.

```
cred-<instance>-nonprod   → folder /sandbox, /development, /qa
cred-<instance>-prod      → folder /production
```

Karena Role Strategy akan diimplementasikan di Jenkins (jawaban #8), pembatasan
folder itu ditegakkan Jenkins sendiri. Satu akun boleh memegang beberapa item
role, jadi plafon qa tidak menuntut kredensial ketiga — cukup dua item role untuk
akun non-produksi:

| Kredensial         | Item role Jenkins | Pola                         | Izin Jenkins                   |
| ------------------ | ----------------- | ---------------------------- | ------------------------------ |
| `cred-<i>-nonprod` | `aio-build`       | `^(sandbox\|development)/.*` | Read, Build, Cancel, Configure |
| `cred-<i>-nonprod` | `aio-staging`     | `^qa/.*`                     | Read, Build, Cancel            |
| `cred-<i>-prod`    | `aio-production`  | `^production/.*`             | Read, Build, Cancel            |

`Configure` sengaja tidak ada di qa dan produksi. Kredensial yang tidak punya
kemampuan adalah kredensial yang tidak bisa disalahgunakan — dan itu
menegakkan plafon di [bagian 5.3](#53-plafon-tingkat-per-lingkungan) di lapis
kedua, bukan hanya di `can()`.

Karena kelima instance memakai segmen folder (jawaban lanjutan #1), pemisahan
ini **ditegakkan Jenkins di semua instance**. Tidak ada instance yang hanya
dijaga platform.

Di luar kedua akun itu, tiap instance punya satu token reload JCasC
([bagian 8.5](#85-konfigurasi-jenkins-dibangkitkan-bukan-diketik)). Token itu
bukan akun pengguna dan tidak bisa menjalankan job, tapi ia rahasia yang paling
berharga di antara ketiganya — alasannya ada di sana.

---

## 8. Keycloak ↔ Jenkins: satu katalog, dua penegak

Induk bagian 9 menyatakan Jenkins tidak bisa OIDC untuk remote API-nya, lalu
membangun seluruh penegakan di atas service account. Bagian pertama masih benar —
tapi kesimpulannya terlalu jauh: Jenkins **bisa** membaca peran Keycloak untuk
otorisasinya sendiri, dan itu menutup satu risiko yang tersirat di induk tanpa
pernah disebut namanya.

Risiko itu: **dua model izin yang harus disamakan manual.** Di induk, RBAC
platform dan izin folder Jenkins adalah dua daftar terpisah. Keduanya bisa
menyimpang, dan yang menyimpang tidak menimbulkan gejala — sampai seseorang
menemukan dirinya bisa melakukan lewat UI Jenkins apa yang ditolak platform.

### 8.1 Rangkaiannya

```
Keycloak — katalog peran, satu-satunya sumber
    │
    ├── Platform AIO      membaca peran ATOMIK    → memutuskan aksi lewat API
    │
    └── Jenkins × 5       membaca peran KOMPOSIT  → Role Strategy mengikatnya
                          sebagai authority          ke pola job per instance
```

**Granularitasnya sengaja berbeda per konsumen:**

| Konsumen | Membaca                                   | Kenapa granularitas itu                                                                              |
| -------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Platform | atomik — `jenkins:promote:env:production` | Butuh presisi per kapabilitas untuk tiap endpoint                                                    |
| Jenkins  | komposit — `jenkins-production-release`   | Role Strategy mengikat per peran; 30 + 8N atomik tak terbaca, 14 + 4N komposit masih terbaca manusia |

Ini bukan kompromi. Tiap konsumen menerima tingkat kehalusan yang benar-benar
bisa dipakainya, dari katalog yang sama.

### 8.2 Pemetaan ke Role-based Authorization Strategy

Peran Keycloak masuk ke Jenkins sebagai _authority_ lewat plugin `oic-auth`
(claim grup), lalu Role Strategy mengikatnya:

| Peran Keycloak                | Jenis role Jenkins       | Pola                                     |
| ----------------------------- | ------------------------ | ---------------------------------------- |
| `jenkins-<env>-<tingkat>`     | Item role                | `^<env>/.*`                              |
| `jenkins-group-<g>-<tingkat>` | Item role                | pola anggota kelompok untuk instance itu |
| `jenkins-agent-admin`         | Agent role + Global role | —                                        |

Contohnya:

```
jenkins-production-readonly  →  ^production/.*                     →  Job/Read
jenkins-production-operate   →  ^production/.*                     →  + Job/Build, Job/Cancel
jenkins-group-payments-*     →  ^[^/]+/payments/.*                 →  sesuai tingkatnya
jenkins-group-payments-admin →  ^(sandbox|development)/payments/.* →  + Job/Configure, Replay
                                ^(qa|production)/payments/.*       →  sampai release saja
```

Baris terakhir adalah plafon [bagian 5.3](#53-plafon-tingkat-per-lingkungan)
dalam bentuk Jenkins: item role kelompok tingkat `admin` dipecah jadi dua pola,
sehingga login langsung ke UI Jenkins tidak bisa melakukan apa yang ditolak
`can()`.

Pola item role di Role Strategy adalah **regex atas nama job lengkap**, dan itu
kebetulan cocok persis dengan bentuk `JobGroup.members[].pattern` di
[bagian 4.2](#42-jobgroup). Glob di katalog diterjemahkan jadi regex saat
dibangkitkan; definisinya tetap satu.

### 8.3 Konfigurasi Keycloak yang dibutuhkan

Kelima instance memakai **`oic-auth`** (jawaban lanjutan #5). Plugin `keycloak`
tidak dipakai: ia bergantung pada adapter Keycloak yang sudah deprecated, dan
claim grupnya tidak bisa diarahkan sebebas `oic-auth`.

- **Satu client per instance Jenkins** (`jenkins-core`, `jenkins-batch`, …) untuk
  alur login OIDC-nya, dibangkitkan dari daftar instance
  ([bagian 4.1](#41-jenkinsinstance)).
- **Protocol mapper "User Client Role"** pada tiap client itu, menunjuk client
  `aio-devops`, hasilnya ditaruh di claim yang dibaca `oic-auth` (`groups`).

Cara paling sederhana: **kirim semua peran, ikat hanya yang komposit.** Authority
yang tidak diikat Role Strategy bersifat inert — peran atomik yang ikut terkirim
tidak melakukan apa pun di Jenkins.

Kalau kelak ukuran token atau keterbacaan jadi masalah, barulah pisahkan
komposit ke client tersendiri (`aio-jenkins`) yang perannya menjadi composite
lintas-client terhadap atomik di `aio-devops`. Tidak sekarang — ia menambah satu
client demi kerapian yang belum ada yang merasakan.

### 8.4 Yang tetap tidak bisa

Jalur **platform → Jenkins API** tetap memakai service account. Jenkins REST API
mengharapkan API token, bukan bearer OIDC; `oic-auth` mengurus login browser,
bukan otentikasi API. Jadi pembagiannya:

| Jalur                        | Yang memutuskan               | Identitas yang dilihat Jenkins |
| ---------------------------- | ----------------------------- | ------------------------------ |
| Lewat platform               | RBAC platform (peran atomik)  | Service account                |
| Login langsung ke UI Jenkins | RBAC Jenkins (peran komposit) | Pengguna sungguhan             |

Dua kolom itu sekarang **dijamin sejalan** karena bersumber dari katalog yang
sama — dan itulah keuntungan sebenarnya dari integrasi ini. Sebelumnya, seseorang
yang login langsung ke Jenkins bisa saja punya izin yang berbeda dari yang
diberikan platform, dan tidak ada yang membandingkannya.

Kalau identitas per pengguna di jalur API dibutuhkan, ada dua jalan — keduanya
**tidak** disarankan sekarang:

1. **Token API per pengguna disimpan platform.** Memberi identitas sungguhan di
   log Jenkins, tapi platform berubah jadi penyimpan kredensial setiap orang, dan
   API token Jenkins secara bawaan tidak pernah kedaluwarsa.
2. **Proxy OAuth2 di depan Jenkins** yang menerjemahkan bearer jadi identitas.
   Bekerja, tapi menambah satu komponen di jalur kritis setiap deployment.

Service account + audit platform + `AIO_REQUESTED_BY` pada parameter build
(induk bagian 12) sudah memberi jejak yang bisa ditelusuri utuh. Keduanya di atas
menambah permukaan yang tidak sebanding dengan itu.

### 8.5 Konfigurasi Jenkins dibangkitkan, bukan diketik

Plugin `configuration-as-code` (JCasC) bisa mengonfigurasi Role Strategy, dan
**platform yang menerapkannya langsung** (jawaban lanjutan #6):

```
Katalog berubah
  → platform membangkitkan authorizationStrategy per instance
  → menyajikannya di endpoint yang dibaca JCasC instance itu
  → memanggil reload JCasC di instance itu
```

Inilah yang menutup lingkaran: kelompok job yang berubah di katalog ikut
mengubah Role Strategy di kelima instance tanpa ada yang mengetik ulang, dan
tanpa jeda tempat keduanya bisa menyimpang.

**Mekanismenya.** Tiap Jenkins menunjuk `CASC_JENKINS_CONFIG` ke dua sumber:
berkas lokal milik instance (security realm `oic-auth`, agent, plugin, dan
seterusnya) dan endpoint platform yang **hanya** memuat `authorizationStrategy`.
JCasC menggabungkan beberapa sumber dan secara bawaan menolak kunci yang sama di
dua sumber, jadi batas kepemilikan itu ditegakkan JCasC sendiri. Endpoint
platform dilindungi token per instance.

Reload dipicu lewat `POST /reload-configuration-as-code/?casc-reload-token=…`,
yang aktif bila Jenkins dijalankan dengan properti sistem `casc.reload.token`.
Token itu hanya bisa memicu reload — platform tidak perlu memegang akun dengan
`Overall/Administer`.

**Tapi itu jangan disalahbaca.** Siapa yang menentukan isi
`authorizationStrategy` menentukan siapa admin di Jenkins. Dengan pilihan ini
platform menjadi **otoritas izin kelima Jenkins**: bug di generator bukan lagi
"403 dari Jenkins", melainkan izin yang keliru di semua instance sekaligus.
Prinsip [bagian 7](#7-kredensial--isolasi-untuk-banyak-instance) — satu bug tidak
boleh langsung jadi deployment produksi — tetap berlaku untuk jalur permintaan
pengguna, tapi **tidak** untuk jalur penerapan katalog. Itu harga yang dibayar
untuk penerapan tanpa langkah manual, dan penangkalnya empat:

1. **Global role tidak berasal dari katalog.** Role dengan `Overall/Administer`
   diambil dari konfigurasi tetap platform per instance, bukan dari data yang
   bisa disunting lewat `catalog:jobgroup:manage`. Menyunting katalog bisa
   menggeser cakupan job, tapi tidak bisa menciptakan admin Jenkins.
2. **Generator memeriksa keluarannya sendiri.** Sebelum menyajikan, ia menolak
   hasil yang memberi `Job/Configure` atau `Replay` pada pola yang menjangkau qa
   atau production. Itu pengulangan sengaja dari plafon — di titik terakhir
   sebelum Jenkins membacanya.
3. **Penerap terpisah dari jalur permintaan.** Modul penerap katalog adalah
   satu-satunya pemegang token reload dan berjalan sebagai worker tersendiri;
   handler permintaan pengguna tidak bisa membacanya.
4. **Setiap penerapan diaudit** — `jenkins.casc.applied` dengan instance, hash
   konfigurasi, dan selisih role yang masuk dan keluar. Reload yang gagal di satu
   instance dicatat dan ditampilkan, bukan dilewati: instance yang tertinggal
   adalah penyimpangan yang hanya terlihat dari sini.

> **Konsekuensinya harus diterima:** katalog jadi satu-satunya tempat yang boleh
> menyunting Role Strategy. Perubahan manual lewat UI Jenkins akan tertimpa
> penerapan berikutnya. Itu memang yang diinginkan — tapi harus diketahui semua
> orang yang selama ini terbiasa mengubahnya di sana, karena kalau tidak, mereka
> akan menyimpulkan Jenkins-nya rusak.

---

## 9. Batas lingkup: mengelola, bukan menggerbang

Alat ini **mengelola akses berdasarkan peran yang diberikan.** Ia tidak
menggerbang tindakan: tidak ada persetujuan, tidak ada break-glass, tidak ada
alur yang menahan sesuatu sampai orang kedua menekan tombol (jawaban #5 dan #7).
Induk bagian 11 karena itu tidak berlaku.

Itu batas lingkup, bukan fitur yang dikurangi. Dan batas itu wajar: yang menahan
dan meloloskan rilis sudah punya tempatnya sendiri — di pipeline, di proses
rilis, atau memang tidak ada. Alat ini menjawab pertanyaan yang berbeda:
**siapa boleh melakukan apa, di mana.**

Yang perlu tercatat adalah ke mana beban itu berpindah, karena itu memengaruhi
cara akses dirancang — bukan sebagai peringatan, melainkan sebagai arahan:

1. **Hibah dibuat sesempit mungkin, bukan sepraktis mungkin.** Di sinilah lingkup
   kelompok job di [bagian 3](#3-lingkup-dua-sumbu) memberi nilainya yang
   sebenarnya: beri `jenkins-group-payments-release` kepada orang yang cuma
   mengurus payments, bukan `jenkins-production-release`. Tanpa gerbang per
   tindakan, luas hibah **adalah** kendalinya.
2. **Audit log adalah jejak satu-satunya.** `jenkins.build.trigger`,
   `jenkins.deployment.promoted`, `catalog.jobgroup.update`, dan
   `jenkins.casc.applied` harus lengkap dan tidak boleh gagal diam-diam, karena
   tidak ada catatan persetujuan yang bisa dijadikan rujukan kedua.
3. **Peninjauan hibah jadi rutin, bukan kejadian.** Usul: tinjau pemegang akses
   tulis produksi tiap kuartal, **beserta** perubahan katalog yang memperluas
   cakupan produksi sebuah kelompok ([bagian 4.4](#44-siapa-yang-menyunting-katalog)).
   Itu satu-satunya titik di mana seseorang melihat kedua daftar itu utuh.

Kalau kelak persetujuan dibutuhkan, ia bisa dipasang tanpa mengubah model peran:
`jenkins-production-release` tetap berarti "boleh menjalankan", dan yang
bertambah cuma satu peran penyetuju beserta alurnya di backend. Model ini tidak
menutup pintunya.

---

## 10. Yang diparkir

Diputuskan **tidak sekarang**, dan disimpan supaya keputusannya tidak perlu
diulang dari nol:

| Hal                               | Status                                                        | Bila dibutuhkan                                                                                      |
| --------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `params`                          | Kapabilitas tetap didefinisikan, tidak masuk tingkat mana pun | Tambahkan ke tingkat, dan **wajib** bersama daftar-boleh parameter per lingkungan                    |
| Persetujuan produksi              | Dihapus                                                       | Tambah `jenkins-production-approve` + alur backend; model peran tidak berubah                        |
| Break-glass                       | Dihapus                                                       | Ikut dengan persetujuan; tanpa persetujuan ia tidak punya arti                                       |
| Tingkat `inventory`               | Belum dibuat                                                  | Bila ada auditor yang boleh melihat daftar pipeline tapi bukan isi log                               |
| Lingkup per instance              | Tidak dibuat                                                  | Tidak perlu — cukup kelompok job berpola `**` di instance itu                                        |
| EA akses tulis                    | Tidak diberikan                                               | Tambahkan peran akses seperlunya; preset tidak perlu diubah                                          |
| `environmentFrom` (strategi lain) | Tidak dibuat; kelimanya `folder-segment`                      | Instance baru yang lingkungannya di akhiran nama job — dan di sana isolasi kredensial hilang         |
| `JenkinsInstance.environments`    | Tidak dibuat; kelimanya punya empat lingkungan                | Instance yang tidak punya salah satu lingkungan                                                      |
| JCasC model tarik                 | Tidak dipilih; platform menerapkan langsung                   | Bila platform tidak boleh lagi jadi otoritas izin Jenkins — instance menarik dari repo yang ditinjau |
| Penyunting katalog selain DevOps  | Tidak dibuat                                                  | Pisahkan `catalog:jobgroup:manage` dari `role-devops`                                                |

Catatan untuk `params`: kalau nanti dipakai, ia **tidak boleh** dihidupkan
sendirian. Sebuah job produksi berparameter `BRANCH` membuat pemegang `params`
setara punya hak tulis penuh ke produksi. Daftar-boleh parameter per lingkungan
adalah bagian dari fiturnya, bukan pelengkap.

---

## 11. Pertanyaan lanjutan

### 11.1 Jawaban

Delapan pertanyaan yang muncul dari jawaban di bagian 1, ditambah satu (#9)
yang ditemukan saat membahasnya. Semuanya terjawab; dampaknya sudah ditulis di
bagian yang disebut.

| #   | Pertanyaan                                                       | Jawaban                                                      | Dampak                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ⚠️ Kelima Jenkins memakai konvensi folder yang sama?             | **Ya**, semuanya `/<lingkungan>/<aplikasi>/<pipeline>`       | `environmentFrom` tidak dibuat; isolasi kredensial ditegakkan Jenkins di semua ([4.1](#41-jenkinsinstance), [7](#7-kredensial--isolasi-untuk-banyak-instance))                                    |
| 2   | ⚠️ Kelompok job per aplikasi, per tim, atau per sistem?          | **Per aplikasi**                                             | Nama kelompok = nama aplikasi ([4.2](#42-jobgroup))                                                                                                                                               |
| 3   | Siapa yang boleh menyunting katalog kelompok job?                | **DevOps**                                                   | `catalog:jobgroup:manage` di `role-devops` ([4.4](#44-siapa-yang-menyunting-katalog))                                                                                                             |
| 4   | Satu job boleh masuk lebih dari satu kelompok?                   | **Boleh**                                                    | Penggabungan lintas kelompok ([3.2](#32-aturan-keputusan)); tumpang-tindih ditampilkan ([4.3](#43-yang-harus-dijaga-soal-pola))                                                                   |
| 5   | `oic-auth` atau plugin `keycloak`?                               | **`oic-auth`** di kelimanya                                  | [8.3](#83-konfigurasi-keycloak-yang-dibutuhkan)                                                                                                                                                   |
| 6   | Siapa yang menerapkan `jenkins.yaml` ke tiap instance?           | **Platform AIO langsung**                                    | Token reload per instance; platform jadi otoritas izin Jenkins ([8.5](#85-konfigurasi-jenkins-dibangkitkan-bukan-diketik))                                                                        |
| 7   | Instance keenam masuk lewat apa?                                 | **Entri katalog**; tidak ada id instance di kode             | [4.1](#41-jenkinsinstance)                                                                                                                                                                        |
| 8   | Lingkungan mana saja yang ada di tiap instance?                  | **Keempatnya**, di semua instance                            | `JenkinsInstance.environments` tidak dibuat ([4.1](#41-jenkinsinstance))                                                                                                                          |
| 9   | ⚠️ `cred-nonprod` boleh `Configure` di qa? _(temuan pembahasan)_ | **Tidak**; qa diperlakukan seperti produksi soal konfigurasi | Plafon `release` di qa; DevOps di qa turun ke `release` ([5.3](#53-plafon-tingkat-per-lingkungan), [6](#6-matriks-jadi-preset-bukan-definisi), [7](#7-kredensial--isolasi-untuk-banyak-instance)) |

Asal-usul #9: tabel kredensial di bagian 7 sebelumnya memberi
`cred-<i>-nonprod` izin `Configure` di `/qa/**`, padahal induk bagian 9 sengaja
mencabutnya dari qa. Selisih itu lahir diam-diam saat tiga kredensial
non-produksi digabung jadi satu — persis jenis penyimpangan yang tidak
menimbulkan gejala.

### 11.2 Sebelum implementasi

Tidak ada lagi pertanyaan yang mengubah bentuk model. Yang tersisa adalah
persiapan di sisi Jenkins, dan semuanya bisa diperiksa, bukan diputuskan:

1. **Samakan versi plugin** `role-strategy`, `oic-auth`, dan
   `configuration-as-code` di kelima instance. Format YAML Role Strategy pernah
   berubah antar versi, dan generator hanya membangkitkan satu format.
2. **Jalankan kelima instance dengan `casc.reload.token`**, dan pisahkan berkas
   JCasC lokal dari sumber milik platform sebelum penerapan pertama.
3. **Inventaris job yang segmen pertamanya bukan id lingkungan.** Setelah
   peralihan job seperti itu ditolak bagi semua orang
   ([4.1](#41-jenkinsinstance)); lebih baik ditemukan sekarang daripada lewat
   keluhan.
4. **Umumkan bahwa Role Strategy tidak lagi disunting lewat UI**
   ([8.5](#85-konfigurasi-jenkins-dibangkitkan-bukan-diketik)), dan bahwa
   konfigurasi pipeline qa pindah ke repositori Jenkinsfile.

---

## Lampiran — perubahan terhadap dokumen induk

| Bagian induk                     | Status                                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| 1 Delta                          | Tetap, ditambah: `qa` = `staging`                                                                                             |
| 2 Model tiga lapis               | Tetap                                                                                                                         |
| 3 Empat lingkungan               | Alasan untuk `qa` diganti: gerbang akhir sebelum produksi, bukan milik tim penguji; qa mendapat plafon `release`              |
| 4 Kapabilitas                    | Tetap; `params` tidak dipakai                                                                                                 |
| 5 Tingkat akses                  | `params` keluar dari `release`; plafon tingkat per lingkungan                                                                 |
| 6 Katalog peran                  | Ditambah keluarga `group` & `catalog:jobgroup:manage`; ejaan id utuh; `prod-approve`, `breakglass`, `*-admin` qa/prod dihapus |
| 7 Matriks                        | Jadi preset; developer tidak lagi punya akses produksi; DevOps di qa turun ke `release`                                       |
| 8 Peta akses                     | Tetap, ditambah akses berbasis kelompok job                                                                                   |
| 9 Penegakan berlapis             | Kredensial jadi dua per instance × 5 instance; qa tanpa `Configure`; ditambah token reload JCasC                              |
| 10 Struktur folder               | Dikonfirmasi berlaku di kelima instance; `Environment` kehilangan `requiresApproval`, mendapat `maxLevel`                     |
| **11 Persetujuan & break-glass** | **Tidak berlaku**                                                                                                             |
| 12 Token & pemetaan              | Tetap; peran kelompok ikut di `resource_access`                                                                               |
| 13 Audit                         | Ditambah `catalog.jobgroup.update` & `jenkins.casc.applied`; aksi persetujuan & break-glass hilang                            |
| 14 Konfigurasi sebagai kode      | Tetap; peran kelompok ikut dibangkitkan; plafon menentukan komposit mana yang dibangkitkan                                    |
| 15 Dampak ke kode                | Tetap, ditambah lingkup kelompok job dan plafon lingkungan pada `can()`                                                       |
| 16 Pertanyaan terbuka            | Terjawab; pertanyaan lanjutan juga terjawab di [bagian 11](#11-pertanyaan-lanjutan)                                           |

---

_Dokumen ini draf. Bila kelak berselisih dengan induknya, yang di sini yang
berlaku._
