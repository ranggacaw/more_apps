# Fitur Antrian Pasien – Clinic App

## Latar Belakang Masalah

Pasien bisa **booking janji** untuk hari tertentu, namun:
- Tidak ada jaminan siapa yang datang lebih dulu di hari H
- Admin perlu menentukan urutan antrian saat pasien tiba
- Dokter perlu tahu siapa pasien berikutnya yang harus dipanggil
- Pasien ingin tahu posisi antriannya tanpa harus terus bertanya ke admin

---

## Solusi: Sistem Antrian Dua Tahap

```
TAHAP 1 – Booking (H-1 atau lebih)     TAHAP 2 – Antrian (Hari H)
─────────────────────────────────────   ─────────────────────────────
Pasien booking jadwal konsultasi    →   Pasien datang ke klinik
Sistem simpan sebagai "appointment"     Admin klik "Pasien Tiba"
Belum ada nomor antrian             →   Sistem assign nomor antrian
                                        secara otomatis (urut kedatangan)
```

**Inti solusinya:** Nomor antrian **tidak diberikan saat booking**, melainkan **saat pasien check-in di hari H** (urutan siapa cepat dia dapat nomor kecil).

---

## Alur Lengkap

### 1. Pasien Booking (Sebelum Hari H)

```
Pasien → Pilih tanggal & sesi → Konfirmasi booking
Sistem → Simpan appointment dengan status: "booked"
         Belum ada nomor antrian
         Kirim notifikasi: "Booking dikonfirmasi untuk tgl XX"
```

### 2. Admin Check-in Pasien (Hari H, Saat Pasien Tiba)

```
Admin buka halaman "Antrian Hari Ini"
→ Lihat daftar pasien yang sudah booking hari ini
→ Saat pasien A tiba → klik tombol [✓ Pasien Tiba]
→ Sistem otomatis assign nomor antrian (contoh: No. 3)
→ Pasien A dapat nomor urut berdasarkan waktu check-in
```

### 3. Dokter Memanggil Pasien

```
Dokter buka halaman "Antrian Aktif"
→ Lihat pasien dengan nomor terkecil (antrian berikutnya)
→ Klik [Panggil Pasien] → status pasien → "dipanggil"
→ Selesai konsultasi → Klik [Selesai] → status → "done"
→ Sistem otomatis tampilkan pasien berikutnya
```

### 4. Pasien Walk-in (Tanpa Booking)

```
Pasien datang tanpa booking
→ Admin klik [+ Tambah Pasien Walk-in]
→ Isi nama / cari data pasien
→ Sistem assign nomor antrian (sama seperti check-in)
→ Masuk antrian sesuai urutan kedatangan
```

---

## Status Antrian (State Machine)

```
[booked] → [checked_in] → [dipanggil] → [dalam_konsultasi] → [selesai]
                                                              ↓
                                                          [tidak_hadir] ← jika pasien tidak datang
```

| Status | Keterangan | Siapa yang ubah |
|---|---|---|
| `booked` | Sudah booking, belum datang | Otomatis saat booking |
| `checked_in` | Pasien sudah tiba, dapat nomor antrian | Admin |
| `dipanggil` | Dokter sudah memanggil | Dokter / Sistem |
| `dalam_konsultasi` | Sedang diperiksa dokter | Dokter |
| `selesai` | Konsultasi selesai | Dokter |
| `tidak_hadir` | Booking tapi tidak datang sampai klinik tutup | Admin / Otomatis |

---

## UI & Halaman

### Halaman Admin: "Antrian Hari Ini"

```
┌─────────────────────────────────────────────────────────────┐
│  🏥 Antrian Klinik – Senin, 15 Juni 2026        [+ Walk-in] │
├──────┬──────────────────┬───────────┬──────────┬────────────┤
│  No. │ Nama Pasien      │ Booking?  │ Status   │ Aksi       │
├──────┼──────────────────┼───────────┼──────────┼────────────┤
│  1   │ Budi Santoso     │ ✅ Booking │ Selesai  │ –          │
│  2   │ Rina Dewi        │ ✅ Booking │ Dipanggil│ –          │
│  3   │ Ahmad Fauzi      │ ✅ Booking │ Check-in │ [Panggil]  │
│  –   │ Siti Aminah      │ ✅ Booking │ Booked   │ [✓ Tiba]   │
│  –   │ Doni Pratama     │ ✅ Booking │ Booked   │ [✓ Tiba]   │
│  4   │ Joko (Walk-in)   │ ❌ Walk-in │ Check-in │ [Panggil]  │
├──────┴──────────────────┴───────────┴──────────┴────────────┤
│  Total booking: 5  |  Sudah hadir: 4  |  Selesai: 1        │
└─────────────────────────────────────────────────────────────┘
```

**Logika nomor antrian:**
- Pasien yang belum tiba (`booked`) → tidak dapat nomor antrian
- Saat klik `[✓ Tiba]` → sistem assign nomor urut berikutnya secara otomatis

### Halaman Dokter: "Pasien Berikutnya"

```
┌───────────────────────────────────────────┐
│  ANTRIAN AKTIF                            │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  🔵 Sedang Diperiksa                │  │
│  │  No. 2 – Rina Dewi                  │  │
│  │  Keluhan: Demam, batuk              │  │
│  │                    [✓ Selesai]      │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  ┌─────────────────────────────────────┐  │
│  │  🟡 Menunggu – No. 3               │  │
│  │  Ahmad Fauzi                        │  │
│  │                    [▶ Panggil]      │  │
│  └─────────────────────────────────────┘  │
│                                           │
│  Antrian berikutnya: No. 4 – Joko         │
└───────────────────────────────────────────┘
```

### Tampilan Pasien (Opsional – Layar TV / QR Code)

```
┌───────────────────────────────┐
│   🏥 ANTRIAN KLINIK DR. ANNA  │
│                               │
│   Sedang dipanggil:           │
│   ┌───────────────────────┐   │
│   │        No. 2          │   │
│   │      RINA DEWI        │   │
│   └───────────────────────┘   │
│                               │
│   Antrian berikutnya: No. 3   │
│   Menunggu: 3 pasien          │
└───────────────────────────────┘
```

---

## Struktur Database

### Tabel `appointments` (booking)

```sql
CREATE TABLE appointments (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  clinic_id       INT NOT NULL,
  patient_id      INT NOT NULL,
  doctor_id       INT NOT NULL,
  tanggal         DATE NOT NULL,
  sesi            VARCHAR(50),          -- 'pagi', 'siang', atau jam spesifik
  status          ENUM(
                    'booked',
                    'checked_in',
                    'dipanggil',
                    'dalam_konsultasi',
                    'selesai',
                    'tidak_hadir'
                  ) DEFAULT 'booked',
  nomor_antrian   INT NULL,             -- NULL sampai pasien check-in
  waktu_checkin   TIMESTAMP NULL,       -- diisi saat pasien tiba
  waktu_dipanggil TIMESTAMP NULL,
  waktu_selesai   TIMESTAMP NULL,
  tipe            ENUM('booking', 'walkin') DEFAULT 'booking',
  catatan         TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id)  REFERENCES klinik(id),
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  FOREIGN KEY (doctor_id)  REFERENCES users(id)
);
```

### Index Penting

```sql
-- Cari antrian per hari dengan cepat
CREATE INDEX idx_antrian_tanggal ON appointments (clinic_id, tanggal, status);

-- Urutkan antrian berdasarkan nomor
CREATE INDEX idx_nomor_antrian ON appointments (clinic_id, tanggal, nomor_antrian);
```

---

## Logic Check-in (Assign Nomor Antrian)

```sql
-- Saat admin klik "Pasien Tiba", jalankan logic ini:

BEGIN TRANSACTION;

  -- 1. Ambil nomor antrian berikutnya untuk hari ini
  SELECT COALESCE(MAX(nomor_antrian), 0) + 1 AS next_number
  INTO @next_num
  FROM appointments
  WHERE clinic_id = :clinic_id
    AND tanggal = CURDATE()
    AND nomor_antrian IS NOT NULL;

  -- 2. Update appointment pasien
  UPDATE appointments
  SET
    status          = 'checked_in',
    nomor_antrian   = @next_num,
    waktu_checkin   = NOW()
  WHERE id = :appointment_id;

COMMIT;
```

> ⚠️ Gunakan **transaction + row lock** untuk mencegah nomor antrian duplikat jika dua admin klik bersamaan.

---

## API Endpoint

### Check-in Pasien

```
POST /api/antrian/checkin
Body: { "appointment_id": 42 }

Response:
{
  "nomor_antrian": 3,
  "patient_name": "Ahmad Fauzi",
  "status": "checked_in",
  "waktu_checkin": "2026-06-15T09:14:00"
}
```

### Tambah Walk-in

```
POST /api/antrian/walkin
Body: {
  "clinic_id": 1,
  "patient_id": 99,   // atau buat pasien baru inline
  "doctor_id": 5,
  "tanggal": "2026-06-15"
}

Response:
{
  "appointment_id": 87,
  "nomor_antrian": 4,
  "status": "checked_in"
}
```

### Daftar Antrian Hari Ini

```
GET /api/antrian/hari-ini?clinic_id=1&tanggal=2026-06-15

Response:
{
  "tanggal": "2026-06-15",
  "summary": {
    "total_booking": 5,
    "sudah_hadir": 4,
    "dalam_antrian": 2,
    "selesai": 1
  },
  "antrian": [
    { "nomor": 1, "nama": "Budi Santoso",  "status": "selesai"           },
    { "nomor": 2, "nama": "Rina Dewi",     "status": "dalam_konsultasi"  },
    { "nomor": 3, "nama": "Ahmad Fauzi",   "status": "checked_in"        },
    { "nomor": 4, "nama": "Joko",          "status": "checked_in", "tipe": "walkin" }
  ],
  "belum_hadir": [
    { "nama": "Siti Aminah",  "status": "booked" },
    { "nama": "Doni Pratama", "status": "booked" }
  ]
}
```

### Panggil / Selesai Konsultasi

```
PATCH /api/antrian/:appointment_id/status
Body: { "status": "dipanggil" }         // atau "dalam_konsultasi" / "selesai"
```

---

## Akses Role

| Fitur | `super_admin` | `doctor` | `staff` / `admin` |
|---|:---:|:---:|:---:|
| Lihat antrian hari ini | ✅ | ✅ | ✅ |
| Check-in pasien (tiba) | ✅ | ✅ | ✅ |
| Tambah walk-in | ✅ | ✅ | ✅ |
| Panggil pasien | ✅ | ✅ | ❌ |
| Tandai selesai konsultasi | ✅ | ✅ | ❌ |
| Tandai tidak hadir | ✅ | ✅ | ✅ |
| Lihat layar antrian publik | ✅ | ✅ | ✅ |

---

## Edge Cases & Penanganan

| Skenario | Solusi |
|---|---|
| Dua admin klik "Tiba" bersamaan untuk pasien berbeda | Gunakan DB transaction + lock untuk nomor antrian |
| Pasien booking tapi tiba lebih lambat dari walk-in | Walk-in dapat nomor lebih kecil — wajar, karena urut kedatangan |
| Pasien tidak hadir di hari H | Admin klik `[Tidak Hadir]` → status `tidak_hadir`, tidak dapat nomor antrian |
| Dokter sakit / klinik tutup mendadak | Admin batalkan semua antrian hari itu → notif ke semua pasien |
| Pasien ingin tahu posisi antrian | Tampilkan nomor antrian via SMS/WhatsApp saat check-in |

---

## Fitur Opsional (Nice to Have)

- 📱 **Notifikasi WhatsApp/SMS** saat pasien check-in: *"Anda mendapat nomor antrian 3. Estimasi tunggu: 30 menit."*
- 📺 **Layar TV antrian** (tampilan publik di ruang tunggu via URL khusus)
- 🔔 **Notif ke pasien** saat nomor antrian mereka 1–2 lagi dipanggil
- 📊 **Rekap harian** untuk dokter: total pasien, rata-rata waktu konsultasi

---

## Checklist Pengembangan

### Fase 1 – Database
- [ ] Buat/migrasi tabel `appointments` dengan kolom `nomor_antrian`, `waktu_checkin`, `tipe`
- [ ] Tambah index pada `clinic_id + tanggal + status`
- [ ] Buat stored procedure atau aplikasi-level logic untuk assign nomor antrian (dengan transaction)

### Fase 2 – Backend API
- [ ] `POST /api/antrian/checkin` – check-in pasien & assign nomor antrian
- [ ] `POST /api/antrian/walkin` – tambah pasien walk-in
- [ ] `GET /api/antrian/hari-ini` – daftar antrian + pasien belum hadir
- [ ] `PATCH /api/antrian/:id/status` – update status (panggil / selesai / tidak hadir)
- [ ] Guard role: hanya `doctor` dan `staff` klinik yang bisa akses

### Fase 3 – Frontend Admin
- [ ] Halaman "Antrian Hari Ini" dengan dua seksi: sudah hadir & belum hadir
- [ ] Tombol `[✓ Pasien Tiba]` untuk check-in
- [ ] Tombol `[+ Tambah Walk-in]` dengan form cari/tambah pasien
- [ ] Tombol `[Tidak Hadir]` untuk pasien yang tidak datang
- [ ] Auto-refresh daftar antrian setiap 30 detik (atau gunakan WebSocket)

### Fase 4 – Frontend Dokter
- [ ] Halaman "Pasien Berikutnya" menampilkan antrian aktif
- [ ] Tombol `[▶ Panggil]` dan `[✓ Selesai]`
- [ ] Indikator real-time siapa yang sedang dalam konsultasi

### Fase 5 – Opsional
- [ ] Layar TV antrian (halaman publik tanpa login)
- [ ] Notifikasi WhatsApp/SMS saat check-in berhasil
- [ ] Notifikasi ke pasien saat giliran mendekat

---

*Dokumen ini adalah spesifikasi fitur manajemen antrian pasien untuk aplikasi klinik.*
