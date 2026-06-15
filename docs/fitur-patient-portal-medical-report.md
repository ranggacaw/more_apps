# Fitur Patient Portal & Medical Report – Clinic App

## Latar Belakang Masalah

Saat ini aplikasi hanya memiliki role **Doctor** dan **Admin**.  
Pasien tidak punya akun dan tidak bisa mengakses data mereka sendiri.

Namun ada kebutuhan nyata:
- Pasien dengan **paket slimming** wajib datang rutin (misal: seminggu sekali)
- Dokter perlu **memantau perkembangan** pasien dari waktu ke waktu
- Pasien perlu bisa **melihat progres mereka** sendiri tanpa harus tanya ke klinik

---

## Solusi: Akun Patient Terbuat Otomatis

> ❌ Jangan bebankan pembuatan akun ke Doctor atau Admin secara manual.
> ✅ Sistem otomatis membuat akun patient begitu data pasien (nama + no HP) diinput.

### Prinsip Utama

```
Admin input nama + nomor HP pasien
           ↓
Sistem cek: apakah nomor HP ini sudah punya akun?
           ↓
Belum ada → sistem otomatis buat akun patient
           ↓
Password default = 4 digit terakhir nomor HP
           ↓
WhatsApp/SMS otomatis terkirim ke pasien berisi cara login
           ↓
Pasien login → wajib ganti password saat pertama kali masuk
```

### Tidak Ada Langkah Ekstra untuk Admin / Doctor

Admin cukup melakukan hal yang memang sudah mereka lakukan:
**input nama dan nomor HP pasien** saat daftar.
Sistem yang mengurus sisanya — pembuatan akun, pengiriman notifikasi, semua otomatis.

---

## Alur Lengkap: Dari Input Pasien ke Akun Aktif

### Langkah 1 — Admin Input Data Pasien Baru

```
Form Pendaftaran Pasien Baru
─────────────────────────────
Nama Lengkap  : [Siti Aminah          ]
Nomor HP      : [08123456789          ]   ← kunci utama identitas
Tanggal Lahir : [01/05/1990           ]   (opsional)
Jenis Kelamin : [ ● Perempuan ○ Laki  ]   (opsional)
Alamat        : [........................] (opsional)

                              [Simpan & Daftarkan]
```

### Langkah 2 — Sistem Otomatis (Background, Tidak Terlihat Admin)

```javascript
// Pseudocode — dijalankan otomatis saat pasien baru disimpan

async function onPatientCreated(patient) {

  // 1. Cek apakah nomor HP sudah punya akun
  const existing = await users.findByPhone(patient.no_hp);
  if (existing) return; // sudah ada akun, skip

  // 2. Buat password default dari 4 digit terakhir nomor HP
  const defaultPassword = patient.no_hp.slice(-4); // contoh: "6789"
  const hashedPassword  = await bcrypt.hash(defaultPassword, 10);

  // 3. Buat akun user dengan role 'patient'
  await users.create({
    patient_id        : patient.id,
    role              : 'patient',
    username          : patient.no_hp,     // nomor HP sebagai username
    password          : hashedPassword,
    must_change_pass  : true,              // wajib ganti password saat login pertama
    is_active         : true,
  });

  // 4. Kirim notifikasi ke pasien (WhatsApp / SMS)
  await sendWhatsApp(patient.no_hp, `
    Halo ${patient.nama}! 👋
    Akun Anda di Klinik kami sudah aktif.
    
    Login di: https://klinik.app/patient
    Username : ${patient.no_hp}
    Password : ${defaultPassword}
    
    Mohon ganti password setelah login pertama.
  `);
}
```

### Langkah 3 — Pasien Terima Notifikasi & Login

```
WhatsApp masuk ke HP pasien:
─────────────────────────────────────────────
Halo Siti Aminah! 👋
Akun Anda di Klinik dr. Anna sudah aktif.

🔐 Login di: https://klinik.app/patient
📱 Username : 08123456789
🔑 Password : 6789

Mohon ganti password setelah login pertama ya!
─────────────────────────────────────────────

Pasien buka link → login → muncul layar ganti password
→ Akun aktif & siap digunakan
```

---

## Skenario Edge Cases

| Skenario | Penanganan |
|---|---|
| Pasien datang dua kali, diinput ulang oleh admin berbeda | Sistem cek nomor HP — jika sudah ada akun, tidak buat akun baru. Data pasien di-link ke akun yang sama. |
| Pasien tidak punya HP / HP tidak aktif | Admin centang `[ ] Tanpa akun` — data pasien tetap tersimpan, hanya tidak dibuatkan akun. |
| Pasien lupa password | Halaman "Lupa Password" → OTP dikirim ke nomor HP terdaftar |
| Admin salah input nomor HP | Admin bisa edit nomor HP pasien → sistem update username akun secara otomatis |
| Pasien punya lebih dari 1 nomor HP | Gunakan nomor HP utama sebagai username. Nomor lain bisa disimpan sebagai kontak alternatif. |

---

## Empat Role Sistem

| Role | Deskripsi | Akses |
|---|---|---|
| `super_admin` | Admin sistem | Semua fitur, semua klinik |
| `doctor` | Dokter / pemilik klinik | Kelola pasien, tulis laporan, pantau progres |
| `admin` | Staf klinik | Input data pasien, kelola jadwal, check-in antrian |
| `patient` | Pasien terdaftar | Lihat laporan & progres diri sendiri saja |

> **Patient TIDAK BISA** melihat data pasien lain.
> Patient hanya bisa READ — tidak bisa edit atau hapus apapun.

---

## Fitur Medical Report per Sesi Kunjungan

Setiap kali pasien datang (untuk paket apapun), dokter atau admin mengisi **laporan sesi**.

### Struktur Laporan Sesi

```
LAPORAN KUNJUNGAN
─────────────────────────────────────────
Pasien       : Siti Aminah
Tanggal      : 15 Juni 2026
Sesi ke-     : 3 dari 8
Paket        : Slimming Premium
Dokter       : dr. Anna

PENGUKURAN FISIK
─────────────────────────────────────────
Berat Badan      : 72.5 kg   (sesi lalu: 74.0 kg | selisih: -1.5 kg ✅)
Tinggi Badan     : 160 cm
BMI              : 28.3      (sesi lalu: 28.9)
Lingkar Pinggang : 82 cm     (sesi lalu: 84 cm  | selisih: -2 cm ✅)
Lingkar Pinggul  : 96 cm
Tekanan Darah    : 120/80

CATATAN DOKTER
─────────────────────────────────────────
Progres baik. Pasien konsisten mengikuti diet.
Disarankan tambah aktivitas cardio 3x seminggu.

INSTRUKSI UNTUK PASIEN
─────────────────────────────────────────
- Kurangi karbohidrat malam hari
- Minum air minimal 2 liter/hari
- Kembali kontrol: 22 Juni 2026
```

---

## Tipe Paket & Jadwal Kontrol

| Kode Paket | Nama Paket | Frekuensi Kontrol | Durasi |
|---|---|---|---|
| `slimming` | Paket Slimming | Seminggu sekali | 1–3 bulan |
| `skincare` | Perawatan Kulit | 2 minggu sekali | Sesuai program |
| `checkup` | Medical Check-up | Sesuai jadwal | Sekali / berkala |
| `rehabilitation` | Rehabilitasi | Sesuai program | Variatif |
| `custom` | Custom | Ditentukan dokter | Variatif |

---

## Struktur Database

### Tabel `patients`

```sql
CREATE TABLE patients (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  clinic_id       INT NOT NULL,
  nama            VARCHAR(150) NOT NULL,
  tanggal_lahir   DATE,
  jenis_kelamin   ENUM('L', 'P'),
  no_hp           VARCHAR(20) UNIQUE NOT NULL,   -- unik, kunci identitas
  email           VARCHAR(150),
  alamat          TEXT,
  no_rekam_medis  VARCHAR(50) UNIQUE,
  has_account     BOOLEAN DEFAULT TRUE,          -- false jika tanpa HP / opt-out akun
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clinic_id) REFERENCES klinik(id)
);
```

### Tabel `users` (update untuk patient)

```sql
ALTER TABLE users
  ADD COLUMN patient_id       INT NULL,
  ADD COLUMN must_change_pass BOOLEAN DEFAULT FALSE,
  ADD FOREIGN KEY (patient_id) REFERENCES patients(id);

-- Role sekarang mencakup 'patient'
ALTER TABLE users
  MODIFY COLUMN role ENUM('super_admin', 'doctor', 'admin', 'patient');
```

### Tabel `packages` (master paket)

```sql
CREATE TABLE packages (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  clinic_id       INT NOT NULL,
  nama            VARCHAR(150) NOT NULL,
  kode            VARCHAR(50),
  deskripsi       TEXT,
  jumlah_sesi     INT,
  interval_hari   INT,       -- kontrol setiap X hari (7 = seminggu sekali)
  harga           DECIMAL(15,2),
  is_active       BOOLEAN DEFAULT TRUE,
  FOREIGN KEY (clinic_id) REFERENCES klinik(id)
);
```

### Tabel `patient_packages` (pasien yang ikut paket)

```sql
CREATE TABLE patient_packages (
  id              INT PRIMARY KEY AUTO_INCREMENT,
  patient_id      INT NOT NULL,
  package_id      INT NOT NULL,
  doctor_id       INT NOT NULL,
  tanggal_mulai   DATE NOT NULL,
  tanggal_selesai DATE,
  sesi_total      INT,
  sesi_selesai    INT DEFAULT 0,
  status          ENUM('aktif', 'selesai', 'dibatalkan') DEFAULT 'aktif',
  catatan         TEXT,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id)  REFERENCES patients(id),
  FOREIGN KEY (package_id)  REFERENCES packages(id),
  FOREIGN KEY (doctor_id)   REFERENCES users(id)
);
```

### Tabel `medical_reports` (laporan per sesi)

```sql
CREATE TABLE medical_reports (
  id                       INT PRIMARY KEY AUTO_INCREMENT,
  patient_package_id       INT NOT NULL,
  appointment_id           INT NULL,
  patient_id               INT NOT NULL,
  doctor_id                INT NOT NULL,
  sesi_ke                  INT NOT NULL,
  tanggal                  DATE NOT NULL,

  -- Pengukuran fisik
  berat_badan              DECIMAL(5,2) NULL,
  tinggi_badan             DECIMAL(5,2) NULL,
  bmi                      DECIMAL(4,2) NULL,   -- auto-hitung
  lingkar_pinggang         DECIMAL(5,2) NULL,
  lingkar_pinggul          DECIMAL(5,2) NULL,
  tekanan_darah_sistolik   INT NULL,
  tekanan_darah_diastolik  INT NULL,

  -- Catatan
  catatan_dokter           TEXT,
  instruksi_pasien         TEXT,
  jadwal_kontrol_berikutnya DATE NULL,

  -- Status
  status                   ENUM('draft', 'final') DEFAULT 'draft',
  signed_at                TIMESTAMP NULL,

  created_at               TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at               TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (patient_package_id) REFERENCES patient_packages(id),
  FOREIGN KEY (patient_id)         REFERENCES patients(id),
  FOREIGN KEY (doctor_id)          REFERENCES users(id)
);
```

### Auto-hitung BMI (Trigger)

```sql
CREATE TRIGGER calc_bmi
BEFORE INSERT ON medical_reports
FOR EACH ROW
BEGIN
  IF NEW.berat_badan IS NOT NULL AND NEW.tinggi_badan IS NOT NULL AND NEW.tinggi_badan > 0 THEN
    SET NEW.bmi = NEW.berat_badan / POW(NEW.tinggi_badan / 100, 2);
  END IF;
END;
```

### Tabel `report_attachments` (foto progress)

```sql
CREATE TABLE report_attachments (
  id          INT PRIMARY KEY AUTO_INCREMENT,
  report_id   INT NOT NULL,
  tipe        ENUM('foto_before', 'foto_after', 'foto_progress', 'dokumen', 'lainnya'),
  file_path   VARCHAR(255) NOT NULL,
  keterangan  TEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES medical_reports(id)
);
```

---

## API Endpoint

### Registrasi & Auth Patient

```
-- Input pasien baru (Admin) → akun otomatis terbuat
POST /api/patients
Body: { "nama": "Siti Aminah", "no_hp": "08123456789", ... }
// Sistem otomatis: buat akun, kirim WhatsApp

-- Login patient
POST /api/auth/patient/login
Body: { "no_hp": "08123456789", "password": "6789" }

-- Ganti password (wajib saat login pertama)
POST /api/auth/patient/change-password
Body: { "old_password": "6789", "new_password": "xxx" }

-- Lupa password → kirim OTP ke HP
POST /api/auth/patient/forgot-password
Body: { "no_hp": "08123456789" }
```

### Medical Report

```
-- Buat laporan sesi (Doctor / Admin)
POST /api/medical-reports

-- Finalisasi laporan (Doctor only)
PATCH /api/medical-reports/:id/sign

-- Semua laporan pasien (Doctor / Admin)
GET /api/patients/:patient_id/reports

-- Laporan sendiri (Patient)
GET /api/me/reports

-- Grafik progres (Doctor / Patient)
GET /api/patients/:patient_id/progress?metric=berat_badan
GET /api/me/progress
```

---

## UI Halaman

### Form Input Pasien Baru (Admin)

```
┌──────────────────────────────────────────────────────────┐
│  + Daftarkan Pasien Baru                                 │
├──────────────────────────────────────────────────────────┤
│  Nama Lengkap *    [Siti Aminah              ]           │
│  Nomor HP *        [08123456789              ]           │
│                    ℹ️  Digunakan sebagai username login  │
│  Tanggal Lahir     [01 / 05 / 1990           ]           │
│  Jenis Kelamin     ( ● Perempuan )  ( ○ Laki-laki )     │
│  Alamat            [................................]     │
│                                                           │
│  [ ] Pasien tidak memiliki HP / tidak perlu akun         │
│                                                           │
│                     [Batal]  [Simpan & Daftarkan →]      │
└──────────────────────────────────────────────────────────┘

✅ Setelah klik "Simpan":
   Sistem otomatis buat akun + kirim WhatsApp ke pasien.
   Admin tidak perlu lakukan apapun lagi.
```

### Portal Pasien (Setelah Login)

```
┌──────────────────────────────────────────────────────────┐
│  Halo, Siti! 👋                                           │
│                                                           │
│  Paket Slimming Premium                                   │
│  ████████░░░░░░░  Sesi 3 dari 8                          │
│                                                           │
│  📅 Kontrol berikutnya: Senin, 22 Juni 2026              │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  📊 PROGRES SAYA                                          │
│                                                           │
│  Berat Badan     : 72.5 kg  (turun 3 kg sejak mulai) ✅  │
│  BMI             : 28.3     (target: < 25)               │
│  Lingkar Pinggang: 82 cm    (turun 4 cm sejak mulai) ✅  │
│                                                           │
├──────────────────────────────────────────────────────────┤
│  📋 LAPORAN SESI TERAKHIR (15 Jun 2026)                  │
│                                                           │
│  Catatan Dokter:                                          │
│  "Progres baik. Pasien konsisten mengikuti diet..."      │
│                                                           │
│  Instruksi:                                               │
│  • Kurangi karbohidrat malam hari                        │
│  • Minum air minimal 2 liter/hari                        │
│                                                           │
│                              [Lihat Semua Laporan]       │
└──────────────────────────────────────────────────────────┘
```

---

## Notifikasi Otomatis

| Trigger | Pesan | Channel |
|---|---|---|
| Akun baru dibuat | Kirim username + password default | WhatsApp / SMS |
| Laporan sesi final | "Laporan kunjungan Anda sudah bisa dilihat" | WhatsApp |
| H-1 jadwal kontrol | "Besok Anda jadwal kontrol. Jangan lupa!" | WhatsApp |
| Sisa sesi tinggal 2 | "Sesi paket Anda tinggal 2. Hubungi klinik untuk perpanjang." | WhatsApp |

---

## Matriks Akses Lengkap

| Fitur | `super_admin` | `doctor` | `admin` | `patient` |
|---|:---:|:---:|:---:|:---:|
| Input pasien baru (auto-buat akun) | ✅ | ✅ | ✅ | ❌ |
| Buat / edit laporan sesi | ✅ | ✅ | ✅ input saja | ❌ |
| Finalisasi / tanda tangan laporan | ✅ | ✅ | ❌ | ❌ |
| Lihat laporan semua pasien | ✅ | ✅ kliniknya | ✅ kliniknya | ❌ |
| Lihat laporan diri sendiri | – | – | – | ✅ |
| Lihat grafik progres semua pasien | ✅ | ✅ | ✅ | ❌ |
| Lihat grafik progres diri sendiri | – | – | – | ✅ |
| Assign paket ke pasien | ✅ | ✅ | ❌ | ❌ |
| Upload foto before/after | ✅ | ✅ | ✅ | ❌ |
| Reset password pasien | ✅ | ✅ | ✅ | ❌ |

---

## Checklist Pengembangan

### Fase 1 – Auto-create Akun Patient
- [ ] Tambah value `patient` ke kolom `role` di tabel `users`
- [ ] Tambah kolom `patient_id` dan `must_change_pass` ke tabel `users`
- [ ] Tambah kolom `has_account` ke tabel `patients`
- [ ] Buat service/function `onPatientCreated()` yang otomatis jalan saat pasien baru disimpan
- [ ] Logika cek: jika nomor HP sudah ada akun, skip pembuatan akun baru
- [ ] Integrasi kirim WhatsApp / SMS berisi kredensial login
- [ ] Endpoint login patient (no HP + password)
- [ ] Halaman ganti password wajib saat `must_change_pass = true`
- [ ] Endpoint lupa password via OTP ke nomor HP

### Fase 2 – Paket & Program
- [ ] Buat tabel `packages` (master paket klinik)
- [ ] Buat tabel `patient_packages`
- [ ] CRUD paket oleh Doctor
- [ ] Assign paket ke pasien

### Fase 3 – Medical Report
- [ ] Buat tabel `medical_reports` lengkap
- [ ] Trigger auto-hitung BMI
- [ ] Buat tabel `report_attachments`
- [ ] Endpoint CRUD laporan sesi
- [ ] Endpoint finalisasi laporan (Doctor only)
- [ ] Upload foto before/after per sesi

### Fase 4 – Patient Portal
- [ ] Halaman portal: progres, laporan, jadwal kontrol
- [ ] Grafik progres (berat badan, BMI, lingkar pinggang per sesi)
- [ ] Riwayat semua laporan sesi
- [ ] Detail laporan per sesi (read-only)

### Fase 5 – Notifikasi Otomatis
- [ ] WhatsApp/SMS saat akun dibuat (kredensial login)
- [ ] Notifikasi saat laporan sesi final & bisa dilihat
- [ ] Reminder H-1 sebelum jadwal kontrol
- [ ] Alert sisa sesi hampir habis

### Fase 6 – Testing
- [ ] Test: input pasien baru → akun otomatis terbuat → WhatsApp terkirim
- [ ] Test: nomor HP sama diinput dua kali → akun tidak duplikat
- [ ] Test: patient tidak bisa lihat data pasien lain
- [ ] Test: patient tidak bisa edit/hapus laporan
- [ ] Test: auto-hitung BMI akurat
- [ ] Test: alur lupa password via OTP

---

*Dokumen ini adalah spesifikasi fitur Patient Portal dan Medical Report untuk aplikasi klinik.*
