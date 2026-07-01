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

export function createGuestReport(nama_pelapor, kontak_pelapor, judul, deskripsi, lokasi, foto) {
    if (!db) {
        throw new Error("Database tidak terhubung.");
    }
    const date = new Date();
    const dateStr = date.toISOString().replace(/[-:T]/g, '').slice(0, 14);
    const kode_laporan = 'GCC-' + dateStr + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const stmt = db.prepare(`
        INSERT INTO guest_reports (kode_laporan, nama_pelapor, kontak_pelapor, judul, deskripsi, lokasi, foto, kategori, prioritas, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'Umum', 'Medium', 'pending')
    `);
    
    const info = stmt.run(kode_laporan, nama_pelapor, kontak_pelapor, judul, deskripsi, lokasi, foto);
    return { id: info.lastInsertRowid, kode_laporan };
}
