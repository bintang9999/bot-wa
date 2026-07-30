import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to campuscare-php database
const dbPath = path.resolve(__dirname, '../database.sqlite');
let db;

try {
  db = new Database(dbPath);
} catch (error) {
  console.error("Gagal membuka database CampusCare SQLite:", error);
}

export function createGuestReport(nama_pelapor, kontak_pelapor, judul, deskripsi, lokasi, foto, kategori = 'Umum', prioritas = 'Medium') {
    if (!db) {
        throw new Error("Database tidak terhubung.");
    }
    const date = new Date();
    const dateStr = date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const kode_laporan = 'GCC-' + dateStr + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    // 1. Cari atau buat user berdasarkan kontak WhatsApp
    let userId;
    const email = kontak_pelapor + '@wa.com';
    
    const userRow = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (userRow) {
        userId = userRow.id;
    } else {
        const insertUser = db.prepare("INSERT INTO users (nama, email, password, role) VALUES (?, ?, 'wa_dummy', 'pelapor')");
        const userInfo = insertUser.run(nama_pelapor, email);
        userId = userInfo.lastInsertRowid;
    }

    // 2. Masukkan ke tabel laporan utama (reports)
    const stmt = db.prepare(`
        INSERT INTO reports (kode_laporan, judul, deskripsi, lokasi, foto, kategori, prioritas, status, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `);
    
    const info = stmt.run(kode_laporan, judul, deskripsi, lokasi, foto, kategori, prioritas, userId);
    return { id: info.lastInsertRowid, kode_laporan };
}
