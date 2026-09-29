# Platform Transliterasi Naskah Pegon & Hanacaraka

Platform web open-source untuk alih aksara (transliterasi) dan terjemahan
per-kata naskah kuno beraksara **Pegon** dan **Hanacaraka** secara manual
(crowdsourcing).

Dikembangkan oleh **Tim Literasi Inovasi Teknologi OASE 2026**.

---

## 📖 Tentang Proyek

Karena teknologi OCR/AI saat ini belum mampu membaca tulisan tangan naskah
kuno secara akurat, sistem ini mengandalkan **metode manual oleh manusia**:

1. Admin mengunggah gambar pindaian naskah
2. Kontributor terverifikasi membuat kotak seleksi pada kata tertentu
3. Kontributor mengisi transliterasi Latin + terjemahan Indonesia
4. Admin memvalidasi keakuratan secara akademis
5. Pembaca umum dapat mengakses naskah yang sudah terverifikasi

---

## ✨ Fitur

### Untuk Admin
- Verifikasi pendaftaran kontributor (approve/reject CV & portofolio)
- Upload naskah + halaman (multi-gambar) ke cloud storage
- Review anotasi: approve/reject dengan komentar
- Auto-publish halaman setelah semua anotasi approved

### Untuk Kontributor
- Bekerja di viewer naskah dengan drag-to-create kotak anotasi
- Isi transliterasi Latin, terjemahan Indonesia, catatan filologis
- Submit anotasi untuk direview admin
- Dashboard pribadi: lihat status anotasi + komentar dari admin

### Untuk Pembaca Umum
- Katalog naskah yang sudah terverifikasi
- Viewer naskah dengan tooltip transliterasi + terjemahan
- Toggle tampilkan/sembunyikan kotak anotasi
- Navigasi antar halaman naskah

---

## 🛠 Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Bahasa | TypeScript |
| Styling | TailwindCSS v4 |
| Database | PostgreSQL (Supabase) |
| ORM | Prisma 6 |
| Auth | Auth.js v5 (NextAuth) |
| Storage | Supabase Storage |
| Validation | Zod |

---

## 🚀 Cara Menjalankan

### Prasyarat
- Node.js 20+
- Akun Supabase (gratis)
- Git

### Setup

```bash
# 1. Clone repo
git clone https://github.com/Faal14/naskah-transliterasi.git
cd naskah-transliterasi

# 2. Install dependency
npm install

# 3. Buat file .env dari template
cp .env.example .env
# Isi dengan kredensial Supabase Anda

# 4. Migrasi database
npx prisma migrate dev

# 5. Seed admin pertama
npx prisma db seed

# 6. Jalankan
npm run dev
```

Buka http://localhost:3000

### Akun Demo
- **Admin**: `admin@naskah.id` / `admin123`

---

## 📁 Struktur Proyek

```
src/
├── app/
│   ├── (auth)/            # Login & Register
│   ├── admin/             # Panel admin
│   │   ├── kontributor/   # Verifikasi kontributor
│   │   ├── naskah/        # Upload & kelola naskah
│   │   └── review/        # Review anotasi
│   ├── kontributor/       # Ruang kerja kontributor
│   ├── naskah/[id]/       # Viewer publik
│   └── dashboard/         # Dashboard user
├── components/            # Komponen reusable
├── lib/                   # Utility (prisma, supabase, validators)
├── types/                 # Type definitions
└── auth.ts                # Konfigurasi Auth.js
```

---

## 🗄 Skema Database

- **User** — admin / kontributor / pembaca
- **Manuscript** — naskah (judul, aksara, tahun, sumber)
- **Page** — halaman naskah (gambar, dimensi, status)
- **Annotation** — kotak anotasi (koordinat, transliterasi, terjemahan)
- **Review** — riwayat review admin (approve/reject + komentar)

---

## 📜 Lisensi

- **Kode**: [MIT License](./LICENSE)
- **Data transliterasi & terjemahan**: [CC BY-SA 4.0](./LICENSE-DATA)

---

## 👥 Tim

| Nama | Peran |
|---|---|
| Faaliq Assalam | Desain Web |
| Enjela | Database Manajemen |
| Alfri | Flowchart Sistem |
| Habibah | Analis Naskah Jawa (Hanacaraka) |
| Danil | Analis Naskah Arab/Pegon |
| Almer | Pembina Official |