# Runbook server: dari kosong sampai aplikasi hidup

Untuk deploy LONTAR (naskah-transliterasi) ke server kampus di sub-path `/oase1`.
Dokumen ini tidak memuat IP, nama pengguna, atau rahasia; ganti setiap `<...>` sendiri.

## Status bukti

Belum ada satu pun langkah di server yang pernah dijalankan. Tanda di tiap langkah:

- **[TERBUKTI DI LAPTOP]** — perintah yang sama sudah dijalankan di laptop Ubuntu dan hasilnya dilihat.
- **[BELUM TERBUKTI]** — ditulis dari dokumentasi dan penalaran; perlakukan sebagai rencana,
  periksa hasil tiap perintah sebelum lanjut.

## Tata letak di server

```
/var/www/mhs/oase1/
├── runtime/        Node 22, PM2, data PM2, env.sh (rahasia, chmod 600)
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

- [ ] Jawaban TIPD atas `docs/nginx-request.md` (sub-path atau subdomain, ada tidaknya
      Cloudflare, arsitektur server, izin koneksi keluar).
- [ ] Akses SSH ke server dan hak tulis di `/var/www/mhs/oase1/`.
- [ ] Project Supabase produksi: database, bucket privat `manuscripts`, kunci rahasia.
      **Akun pemiliknya belum diputuskan.**
- [ ] `AUTH_SECRET` baru khusus produksi (`openssl rand -base64 32`); jangan memakai nilai uji.

## 1. Periksa server — [BELUM TERBUKTI]

```bash
uname -m                      # harap x86_64 (lihat catatan engine Prisma di bawah)
lsb_release -ds               # harap Ubuntu 24.04
openssl version               # harap OpenSSL 3.0.x
ls -ld /var/www/mhs/oase1     # harus milik pengguna Anda
ss -ltn | grep ':3001'        # harus kosong: port belum dipakai
curl -sI https://<ref>.supabase.co | head -1   # koneksi keluar ke Supabase
```

Build dibuat di laptop x64 dan membawa engine Prisma `debian-openssl-3.0.x`. Bila server
`aarch64` atau OpenSSL-nya bukan 3.0.x, berhenti: `binaryTargets` di `prisma/schema.prisma`
harus ditambah dulu (perubahan skema, perlu keputusan).

## 2. Pasang Node 22 dan PM2 di `runtime/` — [BELUM TERBUKTI]

Tanpa hak root; semuanya di dalam folder sendiri.

```bash
mkdir -p /var/www/mhs/oase1/runtime /var/www/mhs/oase1/app
cd /var/www/mhs/oase1/runtime

# Ganti <versi> dengan rilis 22.x terbaru di https://nodejs.org/dist/latest-v22.x/
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

## 3. Buat `env.sh` — [BELUM TERBUKTI]

```bash
cd /var/www/mhs/oase1/runtime
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
export AUTH_URL='https://<host>/oase1/api/auth'

# Jumlah proxy tepercaya di depan aplikasi: 1 = hanya Nginx, 2 = ada Cloudflare/LB di depannya
export TRUSTED_PROXY_HOPS=1
```

Catatan:

- Pakai tanda kutip tunggal di sekeliling nilai; password berisi `$` atau `!` rusak tanpa itu.
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_BASE_PATH`, dan `NEXTAUTH_URL` **tidak** ditaruh di
  sini: ketiganya tertanam saat build (langkah 5). Mengubahnya di server tidak berpengaruh.
- `DIRECT_URL` dan `ADMIN_INITIAL_PASSWORD` tidak perlu ada di server (hanya untuk langkah 4).

Periksa: `ls -l env.sh` harus menampilkan `-rw-------`.

## 4. Migrasi dan seed database produksi — dari LAPTOP

Hasil standalone tidak membawa CLI Prisma, jadi langkah ini dijalankan dari repo di laptop.
Simpan kredensial produksi di berkas **di luar repo** (mis. `~/rahasia/oase1-prod.env`,
`chmod 600`) berisi `DATABASE_URL`, `DIRECT_URL`, dan `ADMIN_INITIAL_PASSWORD`.

- `DATABASE_URL` = transaction pooler (port 6543, `?pgbouncer=true`).
- `DIRECT_URL` = **session pooler** (host pooler yang sama, port 5432, tanpa `?pgbouncer=true`).
  Host langsung `db.<ref>.supabase.co` hanya IPv6 dan tidak terjangkau dari jaringan IPv4.

Urutannya wajib: status → migrate deploy → seed.

```bash
cd <repo>
(
  set -a; . ~/rahasia/oase1-prod.env; set +a
  npx prisma migrate status    # 1. lihat dulu: host benar? migrasi apa yang tertunda?
  npx prisma migrate deploy    # 2. terapkan migrasi
  npx prisma db seed           # 3. buat admin awal
)
```

- **[TERBUKTI DI LAPTOP]** terhadap database uji: ketiga perintah, lewat session pooler.
- **[BELUM TERBUKTI]** terhadap database produksi, dan cara memuat env dari berkas di luar
  repo. Nilai di shell mengalahkan `.env` repo; pastikan baris `Datasource` di keluaran
  `migrate status` menunjuk host produksi sebelum menjalankan `migrate deploy`.
- Jangan pernah `migrate dev` atau `migrate reset` ke produksi.
- Seed hanya **membuat** `admin@naskah.id` bila belum ada. Bila database sudah berisi admin
  lama, password-nya tidak berubah dan harus diganti terpisah.
- Password yang salah berulang kali bisa membuat Supabase memblokir IP sementara. Bila
  `P1000` muncul, berhenti dan periksa kredensial; jangan diulang-ulang.

## 5. Build rilis — dari LAPTOP

```bash
git status --short   # harus bersih, supaya BUILD_INFO tidak bertanda -dirty
NEXT_PUBLIC_SUPABASE_URL=https://<ref-produksi>.supabase.co \
NEXT_PUBLIC_BASE_PATH=/oase1 \
NEXTAUTH_URL=https://<host>/oase1/api/auth \
scripts/release.sh
```

- **[TERBUKTI DI LAPTOP]** dengan URL lokal dan Supabase uji; build tidak membutuhkan
  koneksi database.
- **[BELUM TERBUKTI]** dengan URL produksi.
- `next build` juga membaca `.env` di repo. Variabel `NEXT_PUBLIC_*` lain yang ada di sana
  ikut tertanam; tiga variabel di atas aman karena nilai di shell yang menang.
- Untuk subdomain: kosongkan `NEXT_PUBLIC_BASE_PATH` dan pakai
  `NEXTAUTH_URL=https://<subdomain>/api/auth` (begitu juga `AUTH_URL` di `env.sh`).

## 6. Unggah pertama — [BELUM TERBUKTI]

`scripts/deploy.sh` belum pernah dijalankan, termasuk mode dry-run (hanya `bash -n`).

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

```bash
crontab -e
```

Tambahkan satu baris:

```
@reboot /bin/bash -c 'source /var/www/mhs/oase1/runtime/env.sh && pm2 resurrect'
```

`pm2 resurrect` menghidupkan daftar yang disimpan `pm2 save`, jadi ulangi `pm2 save` setiap
kali daftar proses berubah. Cara memastikannya bekerja hanya dengan reboot sungguhan;
tanyakan TIPD apakah `cron @reboot` diizinkan untuk pengguna Anda.

## 9. Uji akhir

Setelah Nginx dipasang TIPD (`docs/nginx-request.md`) — **[BELUM TERBUKTI]** di server:

```bash
BASE_URL=https://<host>/oase1 scripts/smoke.sh        # dari laptop, harap 10/10
curl -sI https://<host>/oase1/.env | head -1           # harap 403 atau 404
curl -sI https://<host>/oase1/runtime/env.sh | head -1 # harap 404, BUKAN 200
curl -s https://<host>/oase1/admin/kontributor | grep -c '@'   # harap 0 (tanpa login)
```

Lalu di browser:

| Uji | Yang diharapkan |
|---|---|
| Login admin | Masuk ke `/oase1/admin`; cookie bernama `__Secure-oase1-lontar.session-token`, `Secure`, `Path=/oase1` |
| Keluar | Kembali ke `/oase1/login` |
| Daftar kontributor, lalu setujui sebagai admin | Akun tampil di admin; kontributor bisa bekerja paling lama 5 menit setelah disetujui |
| Unggah naskah 3–5 MB, lalu satu yang 20–40 MB | Tersimpan; gambar tampil. Bila gagal di ukuran besar, periksa `client_max_body_size` |
| Anotasi, review, komentar tamu, rating, export | Sama seperti uji lokal |
| Rate limit | 6 kali login salah → pesan "Terlalu banyak percobaan"; dari jaringan lain (mis. data seluler) login tetap bisa. Bila ikut terkunci, `TRUSTED_PROXY_HOPS` terlalu kecil |

## 10. Deploy berikutnya

```bash
scripts/release.sh ...   # langkah 5
scripts/deploy.sh        # dry-run
scripts/deploy.sh --go
BASE_URL=https://<host>/oase1 scripts/smoke.sh
```

Bila rilis membawa migrasi baru, jalankan langkah 4 (tanpa seed) **sebelum** `deploy.sh --go`.
Bila `env.sh` berubah, `deploy.sh` sudah me-restart dengan `--update-env`.

## 11. Rollback ke `${DEPLOY_PATH}-prev` — [BELUM TERBUKTI]

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

Lalu dari laptop: `BASE_URL=https://<host>/oase1 scripts/smoke.sh`. Hapus `app-gagal` setelah
selesai diperiksa.

Batas rollback:

- **Database tidak ikut mundur.** Bila rilis yang dibatalkan sudah menerapkan migrasi, kode
  lama berjalan di atas skema baru. Periksa dulu apakah migrasinya hanya menambah kolom atau
  tabel; bila mengubah atau menghapus, jangan rollback tanpa rencana untuk datanya.
- Sebelum menjalankan `deploy.sh --go` lagi, sadari bahwa ia menghapus `app-prev` yang lama.
- Pada deploy pertama, `app-prev` berisi folder kosong; tidak ada yang bisa di-rollback.
