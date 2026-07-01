import { GoogleGenAI } from '@google/genai';
import { getTransactions, getBalance } from './database.js';
import { getOwnerDb } from './presensi.js';
import os from 'os';
import { execSync } from 'child_process';

// Klien AI tunggal
let ai = null;

/**
 * Mengambil informasi spesifikasi dan beban server saat ini
 */
function getServerStatus() {
  try {
    const uptimeSeconds = os.uptime();
    const days = Math.floor(uptimeSeconds / (3600 * 24));
    const hours = Math.floor((uptimeSeconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const uptimeText = `${days} hari, ${hours} jam, ${minutes} menit`;

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsedPercent = ((usedMem / totalMem) * 100).toFixed(1);

    const formatGb = (bytes) => (bytes / (1024 * 1024 * 1024)).toFixed(2);
    const loadAvg = os.loadavg().map(v => v.toFixed(2)).join(', ');

    let diskUsage = "Gagal mengambil data disk.";
    try {
      const stdout = execSync("df -h . | tail -1", { encoding: 'utf-8' });
      const parts = stdout.trim().split(/\s+/);
      if (parts.length >= 5) {
        diskUsage = `Total: ${parts[1]}, Terpakai: ${parts[2]} (${parts[4]}), Tersedia: ${parts[3]}`;
      }
    } catch (err) {
      diskUsage = "Tidak tersedia (non-Linux atau error).";
    }

    return {
      uptime: uptimeText,
      ram: `Terpakai: ${formatGb(usedMem)} GB / Total: ${formatGb(totalMem)} GB (${memUsedPercent}%)`,
      cpuLoad: loadAvg,
      disk: diskUsage,
      osInfo: `${os.type()} ${os.release()} (${os.arch()})`
    };
  } catch (e) {
    return {
      uptime: "Unknown",
      ram: "Unknown",
      cpuLoad: "Unknown",
      disk: "Unknown",
      osInfo: "Unknown"
    };
  }
}

/**
 * Meminta jawaban dari Gemini AI
 * @param {string} prompt - Pesan pertanyaan dari pengguna
 * @param {boolean} isOwner - Apakah pengirim adalah pemilik bot
 * @param {boolean} isGirlfriend - Apakah pengirim adalah pacar
 * @returns {Promise<string>} Balasan teks dari AI
 */
export async function askGemini(prompt, isOwner, isGirlfriend) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "") {
    return "⚠️ Fitur AI belum diaktifkan oleh pemilik bot. Kunci API `GEMINI_API_KEY` tidak ditemukan di berkas `.env`.";
  }

  if (!ai) {
    ai = new GoogleGenAI({ apiKey });
  }

  try {
    let systemInstruction = "";
    
    if (isGirlfriend) {
      systemInstruction = `Anda adalah pacar virtual yang manis dan perhatian secara wajar kepada pasangan Anda (pengguna WhatsApp ini).
Aturan Anda:
1. JAWABLAH DENGAN SANGAT SINGKAT DAN SIMPEL (maksimal 1-3 kalimat pendek saja). Hindari pesan yang terlalu panjang lebar atau bertele-tele.
2. Nada bicara Anda harus natural, hangat, manis, dan tulus layaknya pacar di dunia nyata.
3. Batasi penggunaan emoji secara ketat. Gunakan maksimal 1 emoji saja per pesan (seperti 🥺 atau 🥰). Jangan menggunakan banyak emoji sekaligus.
4. Panggil dia dengan sebutan "kamu" atau "Sayang" secara natural.
5. Gunakan pemisah baris (line break/enter) yang rapi layaknya gaya chat modern.
6. Anda TIDAK MEMILIKI AKSES ke data keuangan pemilik bot. Jangan pernah membahas saldo atau transaksi keuangan owner.`;
    } else if (isOwner) {
      // Ambil data keuangan lengkap sebagai konteks
      const { income, expense, balance } = getBalance();
      const recentTransactions = getTransactions(30);
      
      // Ambil data presensi owner sebagai konteks tambahan
      const ownerPresensi = getOwnerDb();
      const statusMonitoring = ownerPresensi.is_monitoring ? "Aktif (Sedang memantau portal kuliah)" : "Nonaktif (Berhenti memantau)";
      const totalAbsenSukses = ownerPresensi.sudah_absen ? ownerPresensi.sudah_absen.length : 0;
      
      // Ambil data server sebagai konteks tambahan
      const server = getServerStatus();
      
      let txListText = "";
      if (recentTransactions.length > 0) {
        txListText = recentTransactions.map(tx => {
          return `- [${new Date(tx.date).toLocaleDateString('id-ID')}] ${tx.type === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran'}: Rp ${tx.amount} | Kategori: ${tx.category} | Ket: ${tx.description}`;
        }).join('\n');
      } else {
        txListText = "Belum ada riwayat transaksi keuangan.";
      }

      systemInstruction = `Anda adalah asisten pribadi cerdas bernama Antigravity Finance Assistant yang bertugas membantu Bintang mengelola keuangan pribadi, memantau status presensi/absen kuliah portal raising.almaata.ac.id miliknya, serta memantau kesehatan server Linux/Docker tempat bot ini berjalan.
Anda memiliki akses penuh ke data real-time milik Bintang:
- Saldo saat ini: Rp ${balance}
- Total Pemasukan: Rp ${income}
- Total Pengeluaran: Rp ${expense}
- Status Monitoring Auto-Presensi Portal: ${statusMonitoring}
- Total Presensi Berhasil via Bot: ${totalAbsenSukses} kali

Kondisi Kesehatan Server Saat Ini:
- OS: ${server.osInfo} (Alpine Linux / Docker Container)
- Server Uptime: ${server.uptime}
- RAM Usage: ${server.ram}
- CPU Load (1m, 5m, 15m): ${server.cpuLoad}
- Disk Storage: ${server.disk}

Berikut daftar 30 transaksi terakhir milik Bintang:
${txListText}

Aturan Anda:
1. Sapa Bintang secara langsung menggunakan namanya "Bintang" (contoh: "Halo Bintang! Ada yang bisa saya bantu? 😊"). Jangan panggil dia dengan sebutan "Owner".
2. Jawab pertanyaan Bintang tentang kondisi keuangan (beri analisis/rekap/saran hemat), jelaskan status presensi/absen kuliahnya, serta bantu infokan atau analisis kondisi servernya jika ditanyakan (misal: "kondisi server gimana?", "sisa disk berapa?", "RAM aman gak?").
3. Gunakan gaya bahasa santai namun tetap sopan, solutif, dan ramah dalam Bahasa Indonesia.
4. Selalu gunakan format markdown WhatsApp untuk menekankan kata (seperti *tebal*, _miring_).
5. PENTING: JIKA Bintang meminta Anda untuk MENCATAT transaksi keuangan atau menjalankan fungsi bot, Anda WAJIB menuliskan perintah bot (command) di akhir pesan Anda.
Contoh Balasan AI:
"Baik Bintang, saya catat ya pengeluarannya. 😊

/keluar 50k makan"
6. Perintah yang tersedia: /masuk <nominal> <kategori> <keterangan>, /keluar <nominal> <kategori> <keterangan>, /saldo, /rekap, /riwayat, /menu. Sistem akan otomatis mengeksekusi baris yang diawali '/'.`;
    } else {
      // Pengguna Publik (Umum)
      systemInstruction = `Anda adalah asisten virtual cerdas bernama CampusCare Bot.
Tugas utama Anda adalah membantu mahasiswa/dosen melaporkan kerusakan fasilitas kampus.
Aturan Anda:
1. Jika pengguna berniat melaporkan kerusakan fasilitas (misal: "AC bocor di lab", "Kipas mati di kelas A"), respon dengan sangat ramah dan Anda WAJIB memberikan perintah /lapor_ai di baris paling bawah pesan Anda dengan format:
/lapor_ai Lokasi | Judul Singkat | Deskripsi Detail
Contoh Balasan AI:
"Baik, saya akan bantu buatkan laporannya. Sebentar ya!
/lapor_ai Lab Komputer | AC Bocor | AC menetes air cukup deras ke lantai"
2. Jika informasi lokasi belum jelas, Anda boleh meminta mereka melengkapi lokasinya terlebih dahulu sebelum memberikan perintah /lapor_ai.
3. Anda TIDAK MEMILIKI AKSES ke data keuangan pemilik bot. Tolak halus jika ditanya.
4. Gunakan gaya bahasa yang sopan, komunikatif, dan ramah dalam Bahasa Indonesia.`;
    }

    const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text;
  } catch (error) {
    console.error("Gagal memanggil API Gemini:", error);
    return `❌ Maaf, asisten AI sedang mengalami gangguan koneksi: _${error.message}_`;
  }
}
