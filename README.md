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
