# Sistem Manajemen Event & Kehadiran Digital

Implementasi sesuai PRD: **Backend Express + Prisma ORM + MySQL**, **Frontend React (Vite) + Tailwind CSS**.

## Struktur Proyek

```
event-app/
├── backend/     # Express API (JWT auth, QR code, email, dsb)
└── frontend/    # React SPA (Landing Page, Registrasi, Dashboard Admin, Scanner)
```

## 1. Persiapan Database (MySQL)

Buat database kosong terlebih dahulu:

```sql
CREATE DATABASE event_attendance_db;
```

## 2. Menjalankan Backend

```bash
cd backend
npm install
cp .env.example .env
# edit .env: DATABASE_URL, JWT_SECRET, kredensial SMTP (Gmail App Password, dsb)

npx prisma migrate dev --name init   # membuat seluruh tabel sesuai ERD
npm run prisma:seed                  # membuat 2 role + 2 akun admin default
npm run dev                          # server berjalan di http://localhost:5000
```

Akun admin default hasil seeding:
| Role | Email | Password |
|---|---|---|
| Admin Level 1 (penyelenggara) | admin1@event.com | admin123 |
| Admin Level 2 (lapangan) | admin2@event.com | admin123 |

## 3. Menjalankan Frontend

```bash
cd frontend
npm install
cp .env.example .env    # sesuaikan VITE_API_URL jika backend tidak di localhost:5000
npm run dev              # aplikasi berjalan di http://localhost:5173
```

## 4. Alur Pemakaian

1. Buka `http://localhost:5173` → Landing Page publik (daftar event).
2. Login admin via tombol **"Login Admin"** → gunakan akun Admin Level 1 di atas.
3. **Kelola Event** → buat event baru → klik **Publish** agar tampil di Landing Page.
4. Salin/gunakan tautan `http://localhost:5173/events/:id` untuk registrasi peserta (atau unduh **QR Event** dari halaman Kelola Event).
5. Peserta mendaftar melalui formulir → menerima email berisi QR Code (memerlukan konfigurasi SMTP yang valid pada `.env` backend).
6. Login sebagai **Admin Level 2** (admin2@event.com) → buka halaman **Scanner Kehadiran** → pilih event → scan QR peserta atau cari manual (nama/email) sebagai fallback.
7. Pantau **Dashboard**, **Data Peserta**, **Laporan**, dan **Log Email** dari sisi Admin Level 1 — seluruhnya diperbarui otomatis via polling (6–10 detik) sesuai PRD §8.2.

## Ringkasan Endpoint API (prefix `/api`)

```
POST   /auth/login                          Login peserta
POST   /auth/admin                          Login admin -> JWT
GET    /auth/admin                          Profil admin (memerlukan token)
GET    /auth/roles                          Daftar role + jumlah admin

POST   /users                               Buat akun peserta
GET    /users                               Daftar peserta (Admin Level 1)
GET    /users/:id                           Detail peserta

POST   /events                              Buat event (Admin Level 1)
GET    /events                              Daftar event (publik: hanya published)
GET    /events/:id                          Detail event
GET    /events/:id/qr                       QR Code Event (tautan registrasi)
GET    /events/:id/stats                    Statistik event
PATCH  /events/:id/background                Ubah background/banner
PATCH  /events/:id/status                    Ubah status draft/published/closed
GET    /events/dashboard/stats               Statistik dashboard
GET    /events/dashboard/activity            Log aktivitas terbaru

POST   /events/:eventId/registrations        Registrasi peserta + kirim QR via email
GET    /events/:eventId/registrations        Daftar peserta suatu event

POST   /attendance/scan                      Check-in via scan QR
POST   /attendance/manual                    Check-in manual (fallback)
GET    /attendance/event/:eventId            Daftar kehadiran per event

GET    /notifications/email-logs             Log pengiriman email
GET    /notifications/email-logs/stats       Statistik success rate email

POST   /admins                               Buat admin baru (Admin Level 1)
GET    /admins                               Daftar admin

GET    /reports                              Rekap laporan per event + agregat
```

## Catatan Teknis

- **Keamanan**: password di-hash dengan bcrypt; JWT berlaku 1 hari; role guard di setiap endpoint sensitif.
- **QR Code**: 2 jenis — QR Peserta (dibuat sistem saat registrasi, dipindai admin Level 2) dan QR Event (dibuat sistem saat event dibuat, dipindai calon peserta untuk membuka halaman registrasi).
- **Real-time**: menggunakan polling (bukan WebSocket) sesuai keputusan PRD §8.2 — frontend melakukan refetch tiap 8 detik pada Landing Page, Dashboard, dan Data Peserta.
- **Upload foto event**: disimpan sebagai data URL (base64) langsung di kolom `image_url`, tidak bergantung layanan eksternal.
- **Out-of-scope** (sesuai PRD §4.2): payment gateway, notifikasi push/SMS, multi-tenant, self-service reset password, WebSocket.
