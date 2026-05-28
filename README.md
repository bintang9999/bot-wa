# WhatsApp Bot - Finance & Auto Presensi

Bot WhatsApp multi-fungsi yang dibangun menggunakan Node.js dan Baileys. Bot ini dirancang khusus untuk mempermudah manajemen keuangan pribadi dan melakukan absensi otomatis di portal kampus Universitas Alma Ata secara latar belakang (background). Selain itu, bot juga dilengkapi dengan asisten AI pintar menggunakan Google Gemini.

## ✨ Fitur Utama

### 💸 Manajemen Keuangan (Khusus Owner)
* **Pencatatan Keuangan:** Mencatat pemasukan dan pengeluaran beserta kategori dan deskripsinya.
* **Laporan & Rekapitulasi:** Mengecek saldo saat ini, melihat rekap pengeluaran berdasarkan periode (hari/minggu/bulan), dan melihat riwayat transaksi terakhir.
* **Ekspor Data:** Dapat mengekspor data laporan keuangan ke dalam format `CSV`/Excel.

### 🎓 Auto Presensi Kampus (Alma Ata)
* **Presensi Pribadi (Owner):** Memantau otomatis jadwal perkuliahan aktif dan melakukan absensi tanpa perlu membuka portal kampus.
* **Multi-User (Publik):** Pengguna lain (teman/mahasiswa lain) dapat mendaftarkan akun (NPM & Password) mereka untuk ikut menikmati fitur *auto-presensi* yang akan dipantau oleh server bot ini secara bersamaan 24/7.
* **Sistem Anti-Deteksi:** Dilengkapi dengan rotasi token CSRF dan penyesuaian session (*Cookie/Referer*) agar sinkronisasi portal aman dari limitasi/blokir kampus.

### 🤖 Asisten AI (Google Gemini)
* Berbicara dengan bot secara natural menggunakan bahasa sehari-hari.
* AI secara otomatis memiliki akses ke saldo dan fitur bot. Kamu bisa memerintahkan AI seperti *"Tolong catatkan pengeluaran 50k untuk beli makan"* dan sistem bot akan secara cerdas menerjemahkan dan mengeksekusinya.

### 🐳 Deployment Ready (Docker)
* Sangat mudah dipasang menggunakan **Docker & Docker Compose**.
* Dilengkapi dengan pemetaan volume (`volumes`) agar **data keuangan, data absensi mahasiswa, dan sesi login WhatsApp** tidak akan hilang meskipun server/container di-restart.

---

## 🚀 Cara Instalasi & Menjalankan Bot

### Persyaratan Sistem
* Docker & Docker Compose (Direkomendasikan)
* Atau Node.js versi 20+ (jika dijalankan tanpa Docker)

### Langkah-langkah (Menggunakan Docker)

1. **Clone repository ini:**
   ```bash
   git clone https://github.com/bintang9999/bot-wa.git
   cd bot-wa
   ```

2. **Atur Environment Variables:**
   Salin file contoh konfigurasi dan sesuaikan isinya dengan kredensial milikmu:
   ```bash
   cp .env.example .env
   ```
   *Buka file `.env` dan isi token Gemini, nomor WhatsApp Owner, NPM, dan Password portal.*

3. **Jalankan Bot dengan Docker Compose:**
   ```bash
   docker-compose up -d --build
   ```

4. **Tautkan WhatsApp (Scan QR Code):**
   Setelah container berjalan, lihat log terminal untuk melakukan scan QR Code:
   ```bash
   docker logs bot-wa -f
   ```
   Buka aplikasi WhatsApp kamu > Perangkat Tertaut > Tautkan Perangkat. Scan QR Code yang muncul di terminal.

5. **Selesai!**
   Bot WhatsApp kamu sekarang aktif 24 jam. Kirim pesan `/menu` atau sapa bot-mu untuk memulai!

## 🛡️ Keamanan Data
File sensitif seperti `.env`, `node_modules/`, `data/`, dan `auth_info_baileys/` secara default telah dimasukkan ke dalam `.gitignore` sehingga dipastikan **kredensial dan data base pribadi kamu tidak akan bocor atau ter-push ke GitHub publik.**
