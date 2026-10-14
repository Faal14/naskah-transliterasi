# Permintaan konfigurasi Nginx untuk aplikasi `/oase1`

Ditujukan kepada TIPD. Aplikasi: LONTAR (naskah-transliterasi), Next.js 16 mode standalone,
dijalankan dengan Node 22 + PM2 dan hanya mendengarkan di `127.0.0.1:3001`. Database dan
penyimpanan berkas berada di Supabase, jadi MySQL di server tidak dipakai.

> Contoh di bawah belum pernah diuji di server kampus; mohon disesuaikan dengan konfigurasi
> yang berlaku. `<host>` adalah nama host publik server.

## Yang kami minta

| No | Permintaan | Alasan |
|---|---|---|
| 1 | Rute `/oase1` dan `/oase1/...` diteruskan ke `http://127.0.0.1:3001` **tanpa** memotong awalan `/oase1` | Aplikasi dibangun dengan `basePath=/oase1` dan mengharapkan awalan itu utuh |
| 2 | `client_max_body_size 50m;` | Unggah gambar naskah sampai 50 MB per kiriman; bawaan Nginx 1 MB |
| 3 | `proxy_read_timeout` dan `proxy_send_timeout` minimal `120s` | Unggahan besar diteruskan ke Supabase sebelum aplikasi membalas |
| 4 | `X-Forwarded-For` diisi dengan `$proxy_add_x_forwarded_for` | Pembatasan laju (rate limit) per IP pengunjung |
| 5 | `X-Forwarded-Proto` diisi dengan `$scheme` | Aplikasi perlu tahu permintaan asli memakai HTTPS |
| 6 | Header `Host` diteruskan apa adanya (`$host`) | Next.js menolak pengiriman formulir bila `Host` tidak cocok dengan `Origin` |
| 7 | Akses ke berkas tersembunyi (nama diawali titik) ditolak | Mencegah berkas seperti `.env` atau `.git` terbaca dari web |

## Contoh blok konfigurasi

```nginx
# Di dalam blok server { ... } milik <host>

# (7) Tolak berkas tersembunyi, kecuali .well-known (dipakai sertifikat TLS)
location ~ /\.(?!well-known) {
    deny all;
}

# (1) Halaman utama aplikasi berada tepat di /oase1 (tanpa garis miring di akhir)
location = /oase1 {
    proxy_pass http://127.0.0.1:3001;
    include snippets/oase1-proxy.conf;
}

location ^~ /oase1/ {
    proxy_pass http://127.0.0.1:3001;
    include snippets/oase1-proxy.conf;
}
```

```nginx
# snippets/oase1-proxy.conf
proxy_http_version 1.1;
proxy_set_header Host              $host;                       # (6)
proxy_set_header X-Real-IP         $remote_addr;
proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;  # (4)
proxy_set_header X-Forwarded-Proto $scheme;                     # (5)
client_max_body_size 50m;                                       # (2)
proxy_read_timeout   120s;                                      # (3)
proxy_send_timeout   120s;                                      # (3)
```

Dua hal yang mudah terlewat:

- `proxy_pass` ditulis **tanpa** path atau garis miring di akhir (`http://127.0.0.1:3001`, bukan
  `http://127.0.0.1:3001/`). Dengan garis miring, Nginx memotong `/oase1` dan semua halaman
  menjadi 404.
- Mohon **tidak** menambahkan pengalihan `/oase1` → `/oase1/`. Aplikasi sendiri mengalihkan
  `/oase1/` → `/oase1`, sehingga keduanya akan saling mengalihkan tanpa henti.

## Pertanyaan untuk TIPD

1. **Apakah ada Cloudflare, load balancer, atau proxy lain di depan Nginx ini?**
   Aplikasi membaca IP pengunjung dari `X-Forwarded-For` dengan menghitung jumlah proxy
   tepercaya dari kanan (variabel `TRUSTED_PROXY_HOPS` di sisi kami):
   - hanya Nginx → `TRUSTED_PROXY_HOPS=1`;
   - ada Cloudflare atau load balancer di depan Nginx → `TRUSTED_PROXY_HOPS=2`.

   Bila nilainya terlalu kecil, semua pengunjung terhitung sebagai satu IP dan saling
   mengunci; bila terlalu besar, pengunjung bisa memalsukan IP-nya.
2. Bila ada proxy di depan Nginx yang mengakhiri HTTPS, apakah Nginx menerima permintaan
   sebagai HTTP? (Memengaruhi nilai `X-Forwarded-Proto`.)
3. Apakah folder aplikasi di server (`<DIR-APLIKASI>/`) juga disajikan Nginx sebagai
   berkas statis? Bila ya, mohon pastikan seluruh `/oase1/...` hanya diteruskan ke aplikasi
   (seperti blok di atas), supaya berkas di `runtime/` dan `app/` tidak bisa diunduh.
4. Apakah sub-path `/oase1` yang dipakai, atau kami akan diberi subdomain? Aplikasi mendukung
   keduanya, tetapi harus dibangun ulang sesuai pilihan itu.
5. Apakah server boleh membuka koneksi keluar ke Supabase (HTTPS port 443 dan PostgreSQL
   port 6543)?
6. Arsitektur server (`uname -m`): `x86_64` atau `aarch64`?

## Cara kami memeriksa setelah konfigurasi dipasang

```bash
curl -sI https://<host>/oase1          # harap 200
curl -sI https://<host>/oase1/login    # harap 200
curl -sI https://<host>/oase1/.env     # harap 403 atau 404
BASE_URL=https://<host>/oase1 scripts/smoke.sh
```
