# Runbook server: dari kosong sampai aplikasi hidup

Untuk deploy LONTAR (naskah-transliterasi) ke server kampus di
`https://mhs.uinsalatiga.ac.id/oase1`.
Dokumen ini tidak memuat IP, nama pengguna SSH, atau rahasia; ganti setiap `<...>` sendiri.

## Jawaban TIPD (13 Oktober 2026)

| Hal | Jawaban |
|---|---|
| Alamat | Sub-path: `https://mhs.uinsalatiga.ac.id/oase1` (bukan subdomain) |
| Proxy di depan aplikasi | Cloudflare + Nginx, jadi `TRUSTED_PROXY_HOPS=2` |
| Arsitektur server | x86_64 |
| Node dan PM2 | Boleh, dipasang di folder sendiri (tanpa root) |
| `cron @reboot` | Boleh |
| Port aplikasi | `127.0.0.1:3001` |
| Koneksi keluar ke Supabase | Aktif |
| Nginx | Sudah terpasang: `client_max_body_size 50m`, timeout 120s |

## Status bukti

Belum ada satu pun langkah di server yang pernah dijalankan. Jawaban TIPD di atas diterima
apa adanya dan belum diperiksa dari sisi kami. Tanda di tiap langkah:

- **[TERBUKTI DI LAPTOP]** — perintah yang sama sudah dijalankan di laptop Ubuntu dan hasilnya dilihat.
- **[BELUM TERBUKTI]** — ditulis dari dokumentasi dan penalaran; perlakukan sebagai rencana,
  periksa hasil tiap perintah sebelum lanjut.

## Tata letak di server

```
/var/www/mhs/oase1/
├── runtime/        Node 22, PM2, data PM2, env.sh (folder chmod 700, env.sh chmod 600)
├── app/            hasil build (.next/standalone), diisi scripts/deploy.sh
└── app-prev/       cadangan versi sebelumnya, dibuat scripts/deploy.sh
```

Nilai untuk `scripts/deploy.sh`:

```
DEPLOY_PATH=/var/www/mhs/oase1/app
DEPLOY_RUNTIME_ENV=/var/www/mhs/oase1/runtime/env.sh
DEPLOY_PM2_NAME=oase1-lontar
```

## 0. Prasyarat

- [x] Jawaban TIPD atas `docs/nginx-request.md` (tabel di atas).
- [ ] Akses SSH ke server dan hak tulis di `/var/www/mhs/oase1/`.
- [x] Project Supabase produksi: **project baru yang kosong** (akun milik mahasiswa). Data
      project lama tidak dibawa; seluruh akun lama adalah akun uji. Diperiksa dari laptop pada
      13 Oktober 2026 — **[TERBUKTI DI LAPTOP]**:
  - [x] 8 migrasi diterapkan, semua tabel aplikasi berisi 0 baris sebelum admin dibuat;
  - [x] bucket `manuscripts` ada dan privat (tanpa batas ukuran per bucket, tanpa batasan MIME);
  - [x] kunci format baru (`sb_secret_...`) diterima aplikasi untuk membaca bucket;
  - [x] satu akun: `admin@naskah.id` (ADMIN, APPROVED), dibuat dengan
        `scripts/set-admin-password.ts`.
- [x] `AUTH_SECRET` khusus produksi (bukan nilai uji).
- [ ] Batas ukuran unggahan **global** project Supabase (dashboard → Storage → Settings) belum
      terbaca dari laptop. Pastikan nilainya minimal 50 MB; pada paket gratis batasnya bisa
      lebih kecil daripada yang diizinkan Nginx.

## 1. Periksa server — [BELUM TERBUKTI]

```bash
uname -m                      # harap x86_64 (jawaban TIPD; lihat catatan engine Prisma di bawah)
lsb_release -ds               # harap Ubuntu 24.04
openssl version               # harap OpenSSL 3.0.x
ls -ld /var/www/mhs/oase1     # harus milik pengguna Anda
ss -ltn | grep ':3001'        # harus kosong: port belum dipakai
curl -sI https://<ref>.supabase.co | head -1   # koneksi keluar ke Supabase: harus ada baris HTTP
command -v rsync   || echo "rsync TIDAK ADA"     # dipakai scripts/deploy.sh di sisi server
command -v crontab || echo "crontab TIDAK ADA"   # dipakai langkah 8 dan 9
command -v curl tar xz || echo "curl/tar/xz ada yang TIDAK ADA"   # dipakai langkah 2 dan 9
```

Bila `rsync` atau `crontab` tidak ada, berhenti dan minta TIPD memasangnya (keduanya butuh
root). Tanpa `rsync`, `scripts/deploy.sh` gagal di langkah kirim; tanpa `crontab`, aplikasi
tidak hidup lagi setelah reboot.

Build dibuat di laptop x64 dan membawa engine Prisma `debian-openssl-3.0.x`. Bila server
`aarch64` atau OpenSSL-nya bukan 3.0.x, berhenti: `binaryTargets` di `prisma/schema.prisma`
harus ditambah dulu (perubahan skema, perlu keputusan).

## 2. Pasang Node 22 dan PM2 di `runtime/` — [BELUM TERBUKTI]

Tanpa hak root; semuanya di dalam folder sendiri.

```bash
mkdir -p /var/www/mhs/oase1/runtime /var/www/mhs/oase1/app
chmod 700 /var/www/mhs/oase1/runtime   # hanya pemilik: folder ini akan memuat env.sh
ls -ld /var/www/mhs/oase1/runtime      # harap drwx------
cd /var/www/mhs/oase1/runtime

# Ganti <versi> dengan rilis 22.x terbaru di https://nodejs.org/dist/latest-v22.x/
# (pada 13 Oktober 2026: 22.23.3, sama dengan yang dipakai untuk build di laptop)
curl -fsSLO https://nodejs.org/dist/latest-v22.x/node-v<versi>-linux-x64.tar.xz
curl -fsSLO https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt
grep "node-v<versi>-linux-x64.tar.xz" SHASUMS256.txt | sha256sum -c -   # harus "OK"
tar -xJf node-v<versi>-linux-x64.tar.xz
mv node-v<versi>-linux-x64 node

export PATH=/var/www/mhs/oase1/runtime/node/bin:$PATH
node -v            # harap v22.x
npm install -g pm2 # terpasang di runtime/node, bukan di sistem
pm2 -v
```

### Cadangan bila unduhan dari server gagal

Bila `curl` ke nodejs.org atau `npm install -g pm2` gagal dari server (registry diblokir,
proxy, dsb.), siapkan keduanya di laptop lalu salin. Tetap tanpa root.

Di laptop (Node 22 aktif):

```bash
mkdir -p ~/oase1-runtime && cd ~/oase1-runtime
curl -fsSLO https://nodejs.org/dist/latest-v22.x/node-v<versi>-linux-x64.tar.xz
curl -fsSLO https://nodejs.org/dist/latest-v22.x/SHASUMS256.txt
grep "node-v<versi>-linux-x64.tar.xz" SHASUMS256.txt | sha256sum -c -   # harus "OK"

npm install --prefix ./pm2-bundle --registry=https://registry.npmjs.org/ pm2
tar -czf pm2-bundle.tgz pm2-bundle

scp node-v<versi>-linux-x64.tar.xz pm2-bundle.tgz <pengguna>@<host>:/var/www/mhs/oase1/runtime/
```

Di server:

```bash
cd /var/www/mhs/oase1/runtime
tar -xJf node-v<versi>-linux-x64.tar.xz && mv node-v<versi>-linux-x64 node
tar -xzf pm2-bundle.tgz
ln -s ../../pm2-bundle/node_modules/pm2/bin/pm2 node/bin/pm2   # supaya `pm2` ada di PATH
export PATH=/var/www/mhs/oase1/runtime/node/bin:$PATH
node -v && pm2 -v
```

- **[TERBUKTI DI LAPTOP]** untuk bundel PM2: dipasang dengan `--prefix`, diarsipkan (±3,6 MB),
  dibongkar di folder lain, dan daemon PM2 7.0.4 hidup dari sana. Bundel tidak memuat modul
  native (`*.node`), jadi tidak bergantung pada mesin tempat ia dibuat.
- **[BELUM TERBUKTI]**: `scp` ke server dan tautan simbolik `node/bin/pm2`.

## 3. Buat `env.sh` — [BELUM TERBUKTI]

```bash
cd /var/www/mhs/oase1/runtime
ls -ld .                           # harap drwx------ (chmod 700 dari langkah 2)
touch env.sh && chmod 600 env.sh   # izin dipasang SEBELUM rahasia ditulis
nano env.sh
```

Isi (nilai diisi sendiri; jangan pernah di-commit atau ditempel ke obrolan):

```bash
# PATH dan lokasi data PM2
export PATH=/var/www/mhs/oase1/runtime/node/bin:$PATH
export PM2_HOME=/var/www/mhs/oase1/runtime/pm2

# Server Next.js
export NODE_ENV=production
export HOSTNAME=127.0.0.1
export PORT=3001

# Database: transaction pooler (port 6543, akhiri dengan ?pgbouncer=true)
export DATABASE_URL='...'

# Supabase
export SUPABASE_SERVICE_KEY='...'

# Auth.js
export AUTH_SECRET='...'
export AUTH_URL='https://mhs.uinsalatiga.ac.id/oase1/api/auth'
export AUTH_TRUST_HOST='true'

# Jumlah proxy tepercaya di depan aplikasi: Cloudflare + Nginx = 2 (jawaban TIPD)
export TRUSTED_PROXY_HOPS='2'
```

Catatan:

- **Setiap nilai produksi ditulis dalam tanda kutip tunggal** (`'...'`), tanpa kecuali. Kutip
  ganda atau tanpa kutip membuat shell menafsirkan `$`, `!`, `` ` ``, dan `\` di dalam sandi atau
  kunci, dan nilainya berubah tanpa pesan galat. Bila nilainya sendiri memuat kutip tunggal,
  tulis sebagai `'\''`. Sandi database di dalam URL yang memuat `@ : / ? # %` harus
  di-URL-encode lebih dulu.
- `AUTH_URL` harus berakhiran `/oase1/api/auth`, sama persis dengan `NEXTAUTH_URL` saat build.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_BASE_PATH`, dan `NEXTAUTH_URL` **tidak** ditaruh di
  sini: ketiganya tertanam saat build (langkah 5). Mengubahnya di server tidak berpengaruh.
- `DIRECT_URL` dan `ADMIN_INITIAL_PASSWORD` tidak perlu ada di server (hanya untuk langkah 4).
  **[TERBUKTI DI LAPTOP]** pada 13 Oktober 2026: build rilis dijalankan dengan `env -i` dan
  hanya variabel di blok atas (tanpa `DIRECT_URL`), terhadap database produksi lewat
  transaction pooler. `scripts/smoke.sh` lulus 10/10 dan login admin berhasil; log server tidak
  menyebut `DIRECT_URL`.

Periksa: `ls -l env.sh` harus menampilkan `-rw-------`, dan `ls -ld .` menampilkan `drwx------`.

## 4. Migrasi dan akun admin produksi — dari LAPTOP

Hasil standalone tidak membawa CLI Prisma, jadi langkah ini dijalankan dari repo di laptop.
Kredensial produksi disimpan di berkas **di luar repo** (`~/lontar-prod.env`, `chmod 600`),
setiap nilai dalam tanda kutip tunggal.

- `DATABASE_URL` = transaction pooler (port 6543, `?pgbouncer=true`).
- `DIRECT_URL` = **session pooler** (host pooler yang sama, port 5432, tanpa `?pgbouncer=true`).
  Host langsung `db.<ref>.supabase.co` hanya IPv6 dan tidak terjangkau dari jaringan IPv4.

**Status database produksi (project baru):** pada 13 Oktober 2026, `migrate status`,
`migrate deploy` (8 migrasi), dan `scripts/set-admin-password.ts` sudah dijalankan —
**[TERBUKTI DI LAPTOP]**. Langkah ini tidak perlu diulang; jalankan lagi hanya bila ada
migrasi baru, atau untuk mengganti sandi admin.

```bash
cd <repo>
(
  set -a; . ~/lontar-prod.env; set +a
  npx prisma migrate status    # 1. lihat dulu: migrasi apa yang tertunda?
  npx prisma migrate deploy    # 2. terapkan migrasi
  # 3. buat admin, atau ganti sandinya, dari ADMIN_INITIAL_PASSWORD (minimal 12 karakter)
  npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/set-admin-password.ts
)
```

- Tanda kurung membuat variabel hanya hidup di subshell; shell utama tidak ikut memuat rahasia.
- Nilai di shell mengalahkan `.env` repo (yang berisi project uji). Baris `Datasource` di
  keluaran Prisma hanya menampilkan host pooler bersama, **bukan** ref project, jadi cocokkan
  ref di `NEXT_PUBLIC_SUPABASE_URL`, `DATABASE_URL`, dan `DIRECT_URL` pada berkas itu sebelum
  menjalankan apa pun.
- `scripts/set-admin-password.ts` aman diulang: membuat `admin@naskah.id` bila belum ada, atau
  hanya mengganti hash sandinya. Tidak menghapus baris dan tidak mencetak sandi. Ia berhenti
  tanpa mengubah apa pun bila akun itu ada tetapi bukan ADMIN/APPROVED. `prisma db seed` tidak
  dipakai untuk produksi (seed tidak mengganti sandi akun yang sudah ada).
- Aplikasi belum punya fitur ganti sandi. Untuk mengganti sandi admin: ubah
  `ADMIN_INITIAL_PASSWORD` di berkas itu, lalu jalankan perintah ke-3 saja.
- Jangan pernah `migrate dev` atau `migrate reset` ke produksi.
- Password yang salah berulang kali bisa membuat Supabase memblokir IP sementara. Bila
  `P1000` muncul, berhenti dan periksa kredensial; jangan diulang-ulang.

## 5. Build rilis — dari LAPTOP

```bash
nvm use 22           # shell bawaan laptop bisa memakai versi Node lain
git status --short   # harus bersih, supaya BUILD_INFO tidak bertanda -dirty
NEXT_PUBLIC_SUPABASE_URL=https://<ref-produksi>.supabase.co \
NEXT_PUBLIC_BASE_PATH=/oase1 \
NEXTAUTH_URL=https://mhs.uinsalatiga.ac.id/oase1/api/auth \
scripts/release.sh
```

- **[TERBUKTI DI LAPTOP]** dengan nilai produksi pada 13 Oktober 2026 (Node 22.23.3). Build
  tidak membutuhkan koneksi database. Hasilnya diperiksa: tidak ada berkas `.env*` di
  `.next/standalone`; kunci service, sandi database, `AUTH_SECRET`, dan sandi admin (produksi
  maupun uji) tidak ada di 1.633 berkas hasil build; satu-satunya ref Supabase yang tertanam
  adalah ref produksi.
- Cukup tiga variabel itu yang diberikan ke build; rahasia produksi tidak perlu dimuat.
- `next build` juga membaca `.env` di repo (project uji). Variabel `NEXT_PUBLIC_*` lain yang
  ada di sana ikut tertanam; tiga variabel di atas aman karena nilai di shell yang menang.
- `NEXTAUTH_URL` harus berakhiran `/oase1/api/auth`; `release.sh` menolak bentuk lain.

## 6. Unggah pertama — [BELUM TERBUKTI]

Mode dry-run sudah dijalankan di laptop pada 13 Oktober 2026 dengan nilai produksi: ketiga
perintah tercetak dan tidak ada sambungan jaringan yang dibuka — **[TERBUKTI DI LAPTOP]**.
Mode `--go` belum pernah dijalankan.

```bash
export DEPLOY_HOST=<host> DEPLOY_USER=<pengguna>
export DEPLOY_PATH=/var/www/mhs/oase1/app
export DEPLOY_RUNTIME_ENV=/var/www/mhs/oase1/runtime/env.sh
export DEPLOY_PM2_NAME=oase1-lontar

scripts/deploy.sh        # dry-run: baca perintah yang tercetak
scripts/deploy.sh --go   # sungguhan
```

Pada unggah pertama, langkah terakhir (`pm2 restart`) **akan gagal** karena prosesnya belum
ada. Itu wajar: berkas sudah terkirim, lanjut ke langkah 7. Port SSH yang tidak standar
diatur lewat `~/.ssh/config` di laptop.

## 7. Jalankan dengan PM2 — [BELUM TERBUKTI]

Di server:

```bash
source /var/www/mhs/oase1/runtime/env.sh
cd /var/www/mhs/oase1/app
ls BUILD_INFO.txt server.js           # keduanya harus ada
ls -a | grep '^\.env' || echo "tidak ada .env (benar)"

HOSTNAME=127.0.0.1 PORT=3001 pm2 start server.js --name oase1-lontar
pm2 status                            # harap "online"
pm2 logs oase1-lontar --lines 30 --nostream
pm2 save                              # simpan daftar proses untuk langkah 8

curl -sI http://127.0.0.1:3001/oase1/login | head -1   # harap 200
ss -ltn | grep ':3001'                # harus 127.0.0.1:3001, BUKAN 0.0.0.0:3001
```

Bila `ss` menampilkan `0.0.0.0:3001` atau `*:3001`, aplikasi terbuka langsung ke jaringan:
hentikan (`pm2 delete oase1-lontar`), periksa `HOSTNAME` di `env.sh`, lalu ulangi.

## 8. Hidup lagi setelah server reboot — [BELUM TERBUKTI]

TIPD mengizinkan `cron @reboot`. Pasang tanpa membuka editor (baris lama di crontab tetap ada;
`grep -v` mencegah baris ganda bila perintah ini diulang):

```bash
( crontab -l 2>/dev/null | grep -v 'pm2 resurrect'
  echo "@reboot /bin/bash -c 'source /var/www/mhs/oase1/runtime/env.sh && pm2 resurrect' >> /var/www/mhs/oase1/runtime/cron.log 2>&1"
) | crontab -
crontab -l    # baris @reboot harus tampil tepat satu kali
```

`pm2 resurrect` menghidupkan daftar yang disimpan `pm2 save`, jadi ulangi `pm2 save` setiap
kali daftar proses berubah. Cara memastikannya bekerja hanya dengan reboot sungguhan (minta
jadwal ke TIPD); sebagai uji tanpa reboot: `pm2 kill`, lalu jalankan sendiri perintah di dalam
tanda kutip tunggal, dan periksa `pm2 status`.

## 9. Keep-alive — [BELUM TERBUKTI]

Menurut dokumentasi Supabase, project pada paket gratis dijeda setelah sekitar satu minggu
tanpa aktivitas; setelah dijeda, aplikasi gagal sampai project dihidupkan lagi dari dashboard.
Periksa paket project produksi; bila berbayar, bagian ini tidak diperlukan.

Tidak perlu rute baru. `GET /oase1/api/platform-feedback?limit=1` sudah ada, publik, tidak
dibatasi rate limit, dan membaca dua tabel (`PlatformRating`, `PlatformReview`) tanpa memuat
data akun. Panggil dari server sendiri dua kali sehari, langsung ke aplikasi (tidak lewat
Cloudflare/Nginx):

```bash
( crontab -l 2>/dev/null | grep -v 'platform-feedback'
  echo "17 5,17 * * * curl -fsS -m 30 -o /dev/null 'http://127.0.0.1:3001/oase1/api/platform-feedback?limit=1' || echo \"\$(date -Is) keep-alive gagal\" >> /var/www/mhs/oase1/runtime/cron.log"
) | crontab -
crontab -l
```

- **[TERBUKTI DI LAPTOP]**: rute itu membalas 200 JSON dari database produksi
  (`totalRatings: 0`) saat aplikasi berjalan hanya dengan `DATABASE_URL`.
- **[BELUM TERBUKTI]**: baris cron di server, dan bahwa kueri lewat pooler cukup untuk mencegah
  penjedaan. Dalam minggu pertama, lihat tanggal aktivitas terakhir di dashboard Supabase.
- Keep-alive berhenti bila server atau aplikasi mati; `cron.log` mencatat kegagalannya.

## 10. Uji akhir

Nginx sudah dipasang TIPD; uji ini dijalankan setelah langkah 7 — **[BELUM TERBUKTI]** di server:

```bash
BASE_URL=https://mhs.uinsalatiga.ac.id/oase1 scripts/smoke.sh        # dari laptop, harap 10/10
curl -sI https://mhs.uinsalatiga.ac.id/oase1/.env | head -1           # harap 403 atau 404
curl -sI https://mhs.uinsalatiga.ac.id/oase1/runtime/env.sh | head -1 # harap 404, BUKAN 200
curl -s https://mhs.uinsalatiga.ac.id/oase1/admin/kontributor | grep -c '@'   # harap 0 (tanpa login)
```

Lalu di browser:

| Uji | Yang diharapkan |
|---|---|
| Login admin | Masuk ke `/oase1/admin`; cookie bernama `__Secure-oase1-lontar.session-token`, `Secure`, `Path=/oase1` |
| Keluar | Kembali ke `/oase1/login` |
| Daftar kontributor, lalu setujui sebagai admin | Akun tampil di admin; kontributor bisa bekerja paling lama 5 menit setelah disetujui |
| Unggah naskah 3–5 MB, lalu satu yang 20–40 MB | Tersimpan; gambar tampil. Bila gagal di ukuran besar, periksa `client_max_body_size` |
| Anotasi, review, komentar tamu, rating, export | Sama seperti uji lokal |
| Rate limit | 6 kali login salah → pesan "Terlalu banyak percobaan"; dari jaringan lain (mis. data seluler) login tetap bisa. Bila ikut terkunci, `TRUSTED_PROXY_HOPS=2` tidak cocok dengan rantai proxy yang sebenarnya: tanyakan TIPD |

## 11. Deploy berikutnya

```bash
scripts/release.sh ...   # langkah 5
scripts/deploy.sh        # dry-run
scripts/deploy.sh --go
BASE_URL=https://mhs.uinsalatiga.ac.id/oase1 scripts/smoke.sh
```

Bila rilis membawa migrasi baru, jalankan langkah 4 (perintah 1 dan 2 saja) **sebelum** `deploy.sh --go`.
Bila `env.sh` berubah, `deploy.sh` sudah me-restart dengan `--update-env`.

## 12. Rollback ke `${DEPLOY_PATH}-prev` — [BELUM TERBUKTI]

`deploy.sh` menyalin versi yang sedang berjalan ke `app-prev` sebelum mengirim yang baru.
Hanya satu cadangan disimpan; deploy berikutnya menimpanya.

Di server:

```bash
source /var/www/mhs/oase1/runtime/env.sh
cd /var/www/mhs/oase1
cat app-prev/BUILD_INFO.txt          # pastikan ini versi yang dituju

mv app app-gagal                     # simpan versi rusak untuk diperiksa
cp -a app-prev app
pm2 restart oase1-lontar --update-env
curl -sI http://127.0.0.1:3001/oase1/login | head -1   # harap 200
```

Lalu dari laptop: `BASE_URL=https://mhs.uinsalatiga.ac.id/oase1 scripts/smoke.sh`. Hapus `app-gagal` setelah
selesai diperiksa.

Batas rollback:

- **Database tidak ikut mundur.** Bila rilis yang dibatalkan sudah menerapkan migrasi, kode
  lama berjalan di atas skema baru. Periksa dulu apakah migrasinya hanya menambah kolom atau
  tabel; bila mengubah atau menghapus, jangan rollback tanpa rencana untuk datanya.
- Sebelum menjalankan `deploy.sh --go` lagi, sadari bahwa ia menghapus `app-prev` yang lama.
- Pada deploy pertama, `app-prev` berisi folder kosong; tidak ada yang bisa di-rollback.
