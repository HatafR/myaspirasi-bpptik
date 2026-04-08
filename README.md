# 🎫 Sistem Tiket Aspirasi Digital — BPT Komdigi

Platform manajemen tiket aspirasi digital berbasis web untuk **Badan Pemasaran Telekomunikasi (BPT) Kementerian Komunikasi dan Digital Republik Indonesia**. Sistem ini memungkinkan masyarakat untuk menyampaikan kritik, saran, dan komentar secara terstruktur, serta memudahkan admin dalam mengelola dan menindaklanjuti setiap tiket secara efisien.

---

## 📋 Daftar Isi

- [Fitur Utama](#-fitur-utama)
- [Tech Stack](#-tech-stack)
- [Arsitektur Sistem](#️-arsitektur-sistem)
- [Struktur Proyek](#-struktur-proyek)
- [Database Schema](#-database-schema)
- [Persyaratan Sistem](#-persyaratan-sistem)
- [Instalasi & Konfigurasi](#-instalasi--konfigurasi)
- [Environment Variables](#-environment-variables)
- [Menjalankan Aplikasi](#-menjalankan-aplikasi)
- [Deployment dengan Docker](#-deployment-dengan-docker)
- [API Endpoints](#-api-endpoints)
- [Peran Pengguna (Roles)](#-peran-pengguna-roles)
- [Alur Tiket](#-alur-tiket)

---

## ✨ Fitur Utama

### Untuk Masyarakat (Publik)
- 📝 **Submit Tiket** — Mengirim aspirasi (kritik, saran, komentar) beserta lampiran file
- 🔍 **Tracking Tiket** — Melacak status tiket secara real-time menggunakan nomor tiket
- ⭐ **Rating & Ulasan** — Memberikan penilaian kepuasan setelah tiket diselesaikan
- 🤖 **Analisis AI Otomatis** — Tiket secara otomatis diklasifikasikan sentimen & kategorinya menggunakan Google Gemini AI
- 🔒 **Proteksi CAPTCHA** — Menggunakan Google reCAPTCHA untuk mencegah spam

### Untuk Admin
- 📊 **Dashboard Komprehensif** — Statistik tiket, grafik tren, dan ringkasan performa
- 🗂️ **Manajemen Tiket** — Filter, assign, update status, dan balas tiket
- 👥 **Kelola Admin** — Manajemen akun admin (khusus Super Admin & General Admin)
- 🔧 **Kelola Layanan** — Manajemen kategori layanan yang tersedia
- 📈 **Dashboard Sentimen** — Analisis sentimen tiket secara agregat
- 📜 **Audit Log** — Riwayat lengkap setiap perubahan status tiket
- 📧 **Notifikasi Email** — Email otomatis ke pelapor saat tiket disubmit/diselesaikan/dikembalikan

---

## 🛠 Tech Stack

| Kategori | Teknologi |
|----------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **UI** | React 19, CSS Vanilla, Tailwind CSS 4 |
| **Database** | PostgreSQL 15 + [Prisma ORM](https://www.prisma.io/) |
| **Cache/Session** | Redis (via ioredis) |
| **Autentikasi** | JWT (jose + jsonwebtoken), bcrypt |
| **Email** | Nodemailer (SMTP) + Resend API |
| **AI/ML** | Google Gemini API (`@google/generative-ai`) |
| **Validasi** | Zod |
| **CAPTCHA** | Google reCAPTCHA v2 |
| **Alert UI** | SweetAlert2 |
| **Containerization** | Docker + Docker Compose |
| **Reverse Proxy** | Nginx |
| **Monitoring** | Netdata |

---

## 🏗️ Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                    Internet / User                       │
└──────────────────────┬──────────────────────────────────┘
                       │
               ┌───────▼────────┐
               │   Nginx (80)   │  ← Reverse Proxy / Load Balancer
               └───────┬────────┘
                       │
               ┌───────▼────────┐
               │  Next.js App   │  ← Port 3000
               │  (App Router)  │
               └──┬──────────┬──┘
                  │          │
        ┌─────────▼──┐  ┌────▼──────┐
        │ PostgreSQL  │  │   Redis   │
        │  (Port 5432)│  │(Port 6379)│
        └────────────┘  └───────────┘
                  │
        ┌─────────▼──┐
        │  Mailpit   │  ← Email Testing (Dev) / SMTP (Prod)
        │(Port 8025) │
        └────────────┘
```

---

## 📁 Struktur Proyek

```
ticketing-system/
├── prisma/
│   ├── schema.prisma        # Definisi skema database
│   └── seed.js              # Data seed awal (admin, layanan)
├── public/
│   ├── uploads/             # File lampiran tiket (persisted via Docker volume)
│   └── gedung-bpptik.jpg    # Aset gambar
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.jsx         # Halaman utama (Landing Page)
│   │   ├── login/           # Halaman login admin
│   │   ├── dashboard/       # Dashboard pengguna/pelapor
│   │   ├── admin/dashboard/ # Dashboard admin
│   │   ├── track/           # Halaman tracking tiket
│   │   ├── rating/          # Halaman penilaian tiket
│   │   ├── sentiment/       # Dashboard analisis sentimen
│   │   └── api/             # REST API Routes
│   │       ├── auth/        # Login, logout, session
│   │       ├── tickets/     # CRUD tiket
│   │       ├── services/    # Data layanan
│   │       ├── admins/      # Manajemen admin
│   │       ├── uploads/     # Upload file lampiran
│   │       ├── track/       # Tracking tiket publik
│   │       ├── analyze/     # Analisis AI text
│   │       └── public/      # Data publik (services list)
│   ├── components/          # React Components
│   │   ├── LandingPage.jsx      # Form submit tiket publik
│   │   ├── LoginPage.jsx        # Halaman login
│   │   ├── AdminDashboard.jsx   # Dashboard utama admin
│   │   ├── Dashboard.jsx        # Dashboard pelapor
│   │   ├── TrackPage.jsx        # Halaman tracking tiket
│   │   ├── RatingPage.jsx       # Halaman rating & ulasan
│   │   ├── SentimentDashboard.jsx # Analisis sentimen
│   │   ├── Navbar.jsx           # Navigasi global
│   │   ├── SentimentBadge.jsx   # Badge sentimen tiket
│   │   └── CategoryBadge.jsx    # Badge kategori tiket
│   ├── services/
│   │   ├── analyzeText.js       # Analisis teks ML/rule-based
│   │   ├── auth.service.js      # Logic autentikasi
│   │   └── ticket.service.js    # Business logic tiket
│   ├── lib/
│   │   └── ai-analyze.js        # Integrasi Google Gemini AI
│   ├── validations/
│   │   └── ticket.validation.js # Validasi input tiket (Zod)
│   ├── utils/                   # Helper functions
│   ├── constants/               # Konstanta aplikasi
│   ├── styles/                  # Global styles
│   └── middleware.js            # Auth middleware (JWT)
├── Dockerfile                   # Multi-stage Docker build
├── docker-compose.yml           # Konfigurasi development
├── docker-compose.prod.yml      # Konfigurasi production
├── nginx.conf                   # Konfigurasi Nginx
└── .env                         # Environment variables
```

---

## 🗄 Database Schema

Sistem menggunakan **PostgreSQL** dengan Prisma ORM. Berikut adalah model-model utama:

### Model Utama

| Model | Deskripsi |
|-------|-----------|
| `User` | Akun admin dengan role `SUPER_ADMIN`, `GENERAL_ADMIN`, `SERVICE_ADMIN`, atau `SYSTEM` |
| `Service` | Kategori layanan (misal: Pengaduan Jaringan, Layanan Sertifikasi, dll.) |
| `Ticket` | Data tiket aspirasi yang dikirimkan masyarakat |
| `Rating` | Penilaian kepuasan pelapor setelah tiket selesai |
| `NotificationLog` | Riwayat pengiriman notifikasi email |
| `TicketAuditLog` | Log lengkap semua perubahan status dan aksi pada tiket |
| `Attachment` | File lampiran yang diunggah bersama tiket |

### Enum Status Tiket

```
SUBMITTED → ASSIGNED → IN_PROGRESS → RESOLVED → CLOSED
                                   ↘ RETURNED (dikembalikan ke pelapor)
```

---

## 💻 Persyaratan Sistem

### Development
- **Node.js** v20+
- **npm** v10+
- **Docker & Docker Compose** (untuk menjalankan services)
- **PostgreSQL** 15 (via Docker)
- **Redis** (via Docker)

### Production
- **Server Linux** (Ubuntu 22.04+ direkomendasikan)
- **Docker Engine** 24+
- **Docker Compose** v2+
- Minimal **2 GB RAM**, **20 GB storage**

---

## 🚀 Instalasi & Konfigurasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd ticketing-system
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Konfigurasi Environment Variables

Buat file `.env` berdasarkan contoh di bawah (lihat bagian [Environment Variables](#-environment-variables)):

```bash
cp .env.example .env
# Edit sesuai kebutuhan
```

### 4. Jalankan Infrastructure Services (Development)

```bash
docker-compose up -d
```

Ini akan menjalankan:
- **PostgreSQL** di port `5433`
- **Redis** di port `6379`
- **Mailpit** (email testing) di port `8025` (UI) & `1025` (SMTP)
- **pgAdmin** di port `5050`
- **Netdata** (monitoring) di port `19999`

### 5. Setup Database

```bash
# Jalankan migrasi & generate Prisma client
npx prisma db push

# Seed data awal (admin default & layanan)
npx prisma db seed
```

### 6. Jalankan Aplikasi

```bash
npm run dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000)

---

## 🔑 Environment Variables

Buat file `.env` di root proyek dengan variabel berikut:

```env
# ── DATABASE ──────────────────────────────────────
# Format: postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public
DATABASE_URL="postgresql://postgres:password@localhost:5433/ticketing?schema=public"

# ── AUTHENTICATION ────────────────────────────────
# Generate dengan: openssl rand -base64 32
JWT_SECRET="your-jwt-secret-key"

# ── EMAIL (SMTP) ──────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"       # Google App Password

# ── EMAIL (Resend API - opsional) ─────────────────
RESEND_API_KEY="re_xxxxxxxxxxxx"
RESEND_FROM_EMAIL="noreply@yourdomain.com"

# ── REDIS ─────────────────────────────────────────
REDIS_URL="redis://localhost:6379"

# ── AI / ML API ───────────────────────────────────
GEMINI_API_KEY="your-gemini-api-key"
MLAPI_KEY="your-ml-api-key"          # Opsional, untuk ML API eksternal

# ── CAPTCHA ───────────────────────────────────────
NEXT_PUBLIC_RECAPTCHA_SITE_KEY="your-recaptcha-site-key"
RECAPTCHA_SECRET_KEY="your-recaptcha-secret-key"

# ── ENVIRONMENT ───────────────────────────────────
NODE_ENV="development"               # Gunakan "production" saat deploy
```

> **Catatan:** Di mode `development`, reCAPTCHA dinonaktifkan secara otomatis untuk kemudahan pengujian.

---

## ▶️ Menjalankan Aplikasi

### Mode Development

```bash
npm run dev
```

### Mode Production (Lokal)

```bash
npm run build
npm start
```

### Perintah Berguna

```bash
# Lihat database via prisma studio
npx prisma studio

# Reset database & seed ulang
npx prisma db push --force-reset && npx prisma db seed

# Generate ulang Prisma client (setelah ubah schema)
npx prisma generate

# Cek lint
npm run lint
```

---

## 🐳 Deployment dengan Docker

### Development dengan Docker Compose

```bash
# Jalankan semua services (DB, Redis, Mailpit, pgAdmin, Netdata)
docker-compose up -d

# Lihat log
docker-compose logs -f

# Hentikan semua services
docker-compose down
```

### Production dengan Docker Compose

```bash
# 1. Pastikan .env sudah dikonfigurasi dengan benar

# 2. Build & jalankan semua services production
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Inisialisasi database (pertama kali)
docker-compose -f docker-compose.prod.yml exec app npx prisma db push
docker-compose -f docker-compose.prod.yml exec app npx prisma db seed

# 4. Cek status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f app
```

### Services Production

| Service | Port | Deskripsi |
|---------|------|-----------|
| `app` | 3000 | Aplikasi Next.js |
| `postgres` | 5433 | Database PostgreSQL |
| `redis` | 6379 | Cache & session store |
| `mailpit` | 8025, 1025 | Email testing UI |
| `pgadmin` | 5050 | GUI manajemen database |
| `nginx` | 80 | Reverse proxy |

### Persistensi Data (Docker Volumes)

```yaml
# File upload tiket disimpan di volume lokal
volumes:
  - ./public/uploads:/app/public/uploads

# Data database persisten
volumes:
  - postgres_data:/var/lib/postgresql/data
  - redis_data:/data
```

---

## 📡 API Endpoints

### Public (Tidak perlu autentikasi)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/public/services` | Daftar layanan aktif |
| `POST` | `/api/tickets` | Submit tiket baru |
| `GET` | `/api/track?ticketNumber=xxx` | Tracking tiket via nomor |
| `POST` | `/api/uploads` | Upload file lampiran |

### Auth

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `POST` | `/api/auth/login` | Login admin |
| `POST` | `/api/auth/logout` | Logout admin |
| `GET` | `/api/auth/me` | Cek sesi aktif |

### Admin (Perlu autentikasi)

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/tickets` | Daftar semua tiket (dengan filter) |
| `GET` | `/api/tickets/:id` | Detail tiket |
| `PATCH` | `/api/tickets/:id` | Update status/assign tiket |
| `GET` | `/api/services` | Daftar layanan |
| `POST` | `/api/services` | Tambah layanan baru |
| `PATCH` | `/api/services/:id` | Update layanan |
| `DELETE` | `/api/services/:id` | Hapus layanan (soft delete) |
| `GET` | `/api/admins` | Daftar admin |
| `POST` | `/api/admins` | Tambah admin baru |
| `PATCH` | `/api/admins/:id` | Update data admin |
| `DELETE` | `/api/admins/:id` | Hapus admin (soft delete) |

---

## 👤 Peran Pengguna (Roles)

| Role | Akses |
|------|-------|
| **SUPER_ADMIN** | Akses penuh: kelola admin, layanan, semua tiket, dan konfigurasi sistem |
| **GENERAL_ADMIN** | Kelola semua tiket, lihat statistik, kelola layanan |
| **SERVICE_ADMIN** | Hanya dapat mengelola tiket pada layanan yang ditugaskan |
| **SYSTEM** | Akun sistem untuk aksi otomatis (email, AI, dll.) |

---

## 🔄 Alur Tiket

```
Masyarakat submit tiket
        │
        ▼
   [SUBMITTED] ──── AI analisis sentimen & kategori otomatis
        │
        ▼ (Admin assign)
   [ASSIGNED]
        │
        ▼ (Admin mulai kerjakan)
  [IN_PROGRESS]
        │
      ┌─┴──────────────────┐
      ▼                    ▼
  [RESOLVED]           [RETURNED]
  (Selesai)        (Dikembalikan ke
      │              pelapor untuk
      ▼              klarifikasi)
  [CLOSED]
  (Pelapor beri
   rating &
   feedback)
```

---

## 📧 Notifikasi Email

Sistem mengirimkan email otomatis ke pelapor pada event berikut:

| Event | Deskripsi |
|-------|-----------|
| `SUBMITTED` | Konfirmasi tiket berhasil diterima |
| `RESOLVED` | Pemberitahuan tiket telah diselesaikan + link rating |
| `RETURNED` | Pemberitahuan tiket dikembalikan beserta alasan |

---

## 🤖 Analisis AI

Setiap tiket yang masuk dianalisis secara otomatis menggunakan:

1. **Google Gemini AI** — Model AI generatif untuk analisis konteks bahasa Indonesia yang lebih akurat
2. **Rule-based fallback** — Sistem berbasis aturan kata kunci sebagai fallback jika AI tidak tersedia

Hasil analisis meliputi:
- **Sentimen**: `POSITIF`, `NETRAL`, atau `NEGATIF`
- **Kategori**: `KRITIK`, `SARAN`, atau `KOMENTAR`

---

## 🔐 Keamanan

- **JWT Authentication** — Token disimpan di HTTP-only cookie
- **Password Hashing** — Menggunakan bcrypt dengan salt rounds
- **CAPTCHA Protection** — Google reCAPTCHA v2 untuk form publik
- **Input Validation** — Validasi input menggunakan Zod di sisi server
- **Route Protection** — Middleware Next.js untuk proteksi halaman admin
- **Soft Delete** — Data admin dan layanan tidak dihapus permanen

---

## 📊 Monitoring

Sistem dilengkapi dengan **Netdata** untuk monitoring server secara real-time:

- Akses dashboard Netdata di: `http://your-server:19999`
- Memantau CPU, RAM, disk, jaringan, dan container Docker

---

## 🧑‍💻 Dikembangkan Oleh

Sistem ini dikembangkan untuk kebutuhan internal **BPT Komdigi** (Badan Pemasaran Telekomunikasi, Kementerian Komunikasi dan Digital Republik Indonesia).

---

© 2026 BPT Komdigi · Kementerian Komunikasi dan Digital Republik Indonesia
