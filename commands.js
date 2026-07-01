import { downloadMediaMessage } from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createGuestReport } from './campuscare.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../uploads');

// Buat folder uploads jika belum ada
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

export const reportStates = {};

import { 
  addTransaction, 
  getTransactions, 
  deleteTransaction, 
  getBalance, 
  getSummary, 
  getExportCSV, 
  formatRupiah,
  getCicilans,
  addCicilan,
  setorCicilan,
  deleteCicilan,
  getTasks,
  addTask,
  toggleTask,
  deleteTask
} from './database.js';

import { 
  getOwnerDb, 
  saveOwnerDb, 
  getV6Db, 
  saveV6Db, 
  getMd5, 
  Session, 
  syncSessionAndNamespace, 
  extractIdMahasiswa 
} from './presensi.js';

// Pengurai nominal agar fleksibel (contoh: 100k, 50rb, 1.5jt, Rp 10.000)
export function parseAmount(text) {
  let cleaned = text.toLowerCase().replace(/rp/g, '').trim();
  
  let multiplier = 1;
  if (cleaned.endsWith('k') || cleaned.endsWith('rb')) {
    multiplier = 1000;
    cleaned = cleaned.slice(0, -1).replace('rb', '').trim();
  } else if (cleaned.endsWith('jt')) {
    multiplier = 1000000;
    cleaned = cleaned.slice(0, -2).trim();
  }

  // Penanganan format pemisah ribuan dan desimal khas Indonesia vs US
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Format: 1.000.000,50 -> hapus titik, ubah koma ke titik
    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
  } else if (cleaned.includes(',')) {
    // Jika koma diikuti tepat 3 angka di akhir, kemungkinan itu pemisah ribuan (format US)
    if (/,[0-9]{3}$/.test(cleaned)) {
      cleaned = cleaned.replace(/,/g, '');
    } else {
      // Jika koma desimal
      cleaned = cleaned.replace(/,/g, '.');
    }
  } else if (cleaned.includes('.')) {
    // Jika titik diikuti 3 angka di akhir, atau ada lebih dari satu titik, itu ribuan
    if (/\.[0-9]{3}$/.test(cleaned) || (cleaned.split('.').length > 2)) {
      cleaned = cleaned.replace(/\./g, '');
    }
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;
  return num * multiplier;
}

// Menu bantuan Owner (Privat)
function getOwnerMenu() {
  return `╭─〔 HI SELAMAT DATANG 〕─╮
│ 
╰───────────────╯

💵 *Keuangan*

\`/in\` atau \`/masuk\` _<jml> <kat>_
Contoh: \`/in 1.5jt gaji\`

\`/out\` atau \`/keluar\` _<jml> <kat>_
Contoh: \`/out 50k makan\`

\`/s\` — Lihat saldo
\`/r [hari|minggu|bulan]\` — Rekap
\`/h [n]\` — Riwayat transaksi
\`/del <id>\` — Hapus transaksi
\`/ex\` — Export CSV

──────────────────

🎓 *Presensi Pribadi*

\`/ps\` — Aktifkan monitoring
\`/pp\` — Hentikan monitoring
\`/pst\` — Cek status

──────────────────

👥 *Presensi User*

\`/reg <npm> <pass>\` — Daftar
\`/as\` — Aktifkan auto absen
\`/ap\` — Matikan auto absen
\`/ast\` — Status akun
\`/logout\` — Hapus akun

──────────────────

🏦 *Cicilan*

\`/ct <nama> <total> [tgl]\`
Contoh: \`/ct mobil 30jt 28\`

\`/cs <id> <nominal>\`
Contoh: \`/cs cicilan-xxx 50k\`

\`/cl\` — Daftar cicilan
\`/ch <id>\` — Hapus cicilan

──────────────────

📋 *Tugas*

\`/tt <judul>\` — Tambah tugas
Contoh: \`/tt Beli buku\`

\`/tl\` — Daftar tugas
\`/td <id>\` — Tandai selesai/buka
\`/th <id>\` — Hapus tugas

──────────────────

💡 Semua command lama masih bisa dipakai.`;
}

// Menu bantuan Publik (v6)
function getPublicMenu() {
  return `╭─〔 HI SELAMAT DATANG 〕─╮
│ 
╰───────────────╯

👥 *Presensi User*

\`/reg <npm> <pass>\` — Daftar
\`/as\` — Aktifkan auto absen
\`/ap\` — Matikan auto absen
\`/ast\` — Status akun
\`/logout\` — Hapus akun

──────────────────

📢 *Pelaporan Kerusakan*

\`/lapor\` — Mulai buat laporan kerusakan fasilitas

──────────────────

💡 Ketik /m untuk melihat menu ini.`;
}

// Handler untuk /masuk dan /keluar
function handleAdd(args, type) {
  if (args.length < 2) {
    return { 
      text: `⚠️ Format salah! Gunakan:\n*${type === 'pemasukan' ? '/masuk' : '/keluar'} <jumlah> <kategori> <keterangan...>*` 
    };
  }

  const amountText = args[0];
  const amount = parseAmount(amountText);
  if (amount === null || amount <= 0) {
    return { text: `❌ Jumlah nominal tidak valid: *${amountText}*` };
  }

  const category = args[1];
  const description = args.slice(2).join(' ') || category;

  const tx = addTransaction(type, amount, category, description);

  return {
    text: `✅ *Berhasil mencatat ${type}!*\n\n` +
          `🆔 ID: \`${tx.id}\`\n` +
          `📅 Tanggal: ${new Date(tx.date).toLocaleString('id-ID')}\n` +
          `💰 Nominal: *${formatRupiah(tx.amount)}*\n` +
          `🗂️ Kategori: *${tx.category}*\n` +
          `📝 Keterangan: ${tx.description}`
  };
}

// Handler untuk /saldo
function handleShowBalance() {
  const { income, expense, balance } = getBalance();
  return {
    text: `=== 💵 STATUS SALDO ===\n\n` +
          `📥 Total Pemasukan: *${formatRupiah(income)}*\n` +
          `📤 Total Pengeluaran: *${formatRupiah(expense)}*\n` +
          `───────────────────\n` +
          `💰 *Sisa Saldo Anda: ${formatRupiah(balance)}*`
  };
}

// Handler untuk /rekap
function handleShowSummary(args) {
  const period = args[0] ? args[0].toLowerCase() : 'bulan';
  if (!['hari', 'minggu', 'bulan'].includes(period)) {
    return { text: `❌ Periode tidak valid. Pilih antara: *hari*, *minggu*, atau *bulan*.` };
  }

  const sum = getSummary(period);
  
  let catText = '';
  const catEntries = Object.entries(sum.categories).sort((a, b) => b[1] - a[1]);
  if (catEntries.length > 0) {
    catText = `\n*Detail Pengeluaran per Kategori:*\n`;
    catEntries.forEach(([cat, amt]) => {
      catText += `- *${cat}*: ${formatRupiah(amt)}\n`;
    });
  } else {
    catText = `\n_Tidak ada pengeluaran pada periode ini._`;
  }

  return {
    text: `=== 📊 REKAPITULASI KEUANGAN ===\n` +
          `📅 Periode: *${period.toUpperCase()}*\n` +
          `📊 Total Transaksi: *${sum.count}*\n\n` +
          `📥 Total Pemasukan: *${formatRupiah(sum.income)}*\n` +
          `📤 Total Pengeluaran: *${formatRupiah(sum.expense)}*\n` +
          `───────────────────\n` +
          `💰 *Selisih Bersih: ${formatRupiah(sum.balance)}*\n` +
          `${catText}`
  };
}

// Handler untuk /riwayat
function handleShowHistory(args) {
  let limit = 5;
  if (args[0]) {
    const parsedLimit = parseInt(args[0]);
    if (!isNaN(parsedLimit) && parsedLimit > 0) {
      limit = Math.min(parsedLimit, 30);
    }
  }

  const txs = getTransactions(limit);
  if (txs.length === 0) {
    return { text: `📜 Belum ada catatan transaksi keuangan.` };
  }

  let text = `=== 📜 RIWAYAT ${txs.length} TRANSAKSI TERAKHIR ===\n\n`;
  txs.forEach(tx => {
    const date = new Date(tx.date).toLocaleDateString('id-ID');
    const icon = tx.type === 'pemasukan' ? '📥' : '📤';
    text += `${icon} *${formatRupiah(tx.amount)}* [${tx.category.toUpperCase()}]\n` +
            `└ ID: \`${tx.id}\` | ${date}\n` +
            `  _${tx.description}_\n\n`;
  });
  
  return { text: text.trim() };
}

// Handler untuk /hapus
function handleDeleteMapping(args) {
  if (args.length === 0) {
    return { text: `⚠️ Format salah! Gunakan: */hapus <id_transaksi>*\nContoh: \`/hapus TX-1685208573210\`` };
  }

  const id = args[0].trim();
  const success = deleteTransaction(id);
  if (success) {
    return { text: `✅ Berhasil menghapus transaksi dengan ID \`${id}\`.` };
  } else {
    return { text: `❌ Transaksi dengan ID \`${id}\` tidak ditemukan. Periksa kembali ID-nya di menu */riwayat*.` };
  }
}

// Handler untuk /ekspor
function handleExport() {
  const csv = getExportCSV();
  if (!csv) {
    return { text: `❌ Tidak ada data transaksi yang bisa diekspor.` };
  }

  return {
    document: Buffer.from(csv),
    fileName: `laporan-keuangan-${new Date().toISOString().split('T')[0]}.csv`,
    mimetype: 'text/csv'
  };
}

// -------------------------------------------------------------
// HANDLER PRESENSI PRIBADI (V5)
// -------------------------------------------------------------
function handleOwnerPantauStart() {
  const db = getOwnerDb();
  db.is_monitoring = true;
  saveOwnerDb(db);
  return { 
    text: `🟢 *Pemantauan Presensi Pribadi Aktif!*\n\nBot akan memeriksa kelas aktif di portal secara berkala setiap 2-3 menit di latar belakang.` 
  };
}

function handleOwnerPantauStop() {
  const db = getOwnerDb();
  db.is_monitoring = false;
  saveOwnerDb(db);
  return { 
    text: `🔴 *Pemantauan Presensi Pribadi Dinonaktifkan!*\n\nBot tidak akan melakukan pengecekan ke server kampus sampai diaktifkan kembali.` 
  };
}

function handleOwnerPantauStatus() {
  const db = getOwnerDb();
  const isMon = db.is_monitoring ? "🟢 Aktif (Memantau)" : "🔴 Nonaktif (Pause)";
  const totalAbsen = db.sudah_absen ? db.sudah_absen.length : 0;
  
  return {
    text: `📊 *STATUS ABSEN PRIBADI OWNER*\n\n` +
          `• *Auto-Monitoring:* ${isMon}\n` +
          `• *Total Kelas Sukses:* \`${totalAbsen}\` kelas\n` +
          `• *ID Mahasiswa:* \`${process.env.ID_MHS || '-'}\``
  };
}

// -------------------------------------------------------------
// HANDLER PRESENSI MULTI-USER (V6)
// -------------------------------------------------------------
async function handleRegister(senderJid, args) {
  if (args.length < 2) {
    return {
      text: `⚠️ Format salah! Gunakan:\n*/daftar <NPM> <PASSWORD>*\n\n_Contoh:_ \`/daftar 243200329 rahasia123\``
    };
  }

  const npm = args[0].trim();
  const password = args[1].trim();

  if (!/^\d+$/.test(npm) || npm.length < 5) {
    return { text: `❌ NIM/NPM harus berupa angka saja dan minimal 5 digit.` };
  }

  const f1 = getMd5(npm);
  const f2 = getMd5(password);

  const session = new Session();
  const loginRes = await syncSessionAndNamespace(session, f1, f2);

  if (!loginRes.success) {
    return {
      text: `❌ *Pendaftaran Gagal!*\nNIM/NPM atau Password Portal Anda salah. Silakan periksa kembali.`
    };
  }

  const id_mhs = await extractIdMahasiswa(session, loginRes.namespace);
  if (!id_mhs) {
    return {
      text: `⚠️ Gagal mengekstrak ID Mahasiswa otomatis dari dashboard portal. Silakan hubungi Owner.`
    };
  }

  const db = getV6Db();
  db.users[senderJid] = {
    npm,
    f1,
    f2,
    id_mhs,
    is_monitoring: true,
    sudah_absen: db.users[senderJid]?.sudah_absen || []
  };
  saveV6Db(db);

  return {
    text: `✅ *Pendaftaran Berhasil!*\n\n` +
          `• *NPM:* \`${npm}\`\n` +
          `• *ID Mahasiswa:* \`${id_mhs}\`\n` +
          `• *Status Auto-Presensi:* 🟢 Aktif\n\n` +
          `Bot sekarang memantau presensi Anda setiap 2-3 menit secara otomatis di latar belakang.`
  };
}

function handleAbsenStart(senderJid) {
  const db = getV6Db();
  if (!db.users[senderJid]) {
    return { text: `❌ Anda belum mendaftar. Silakan gunakan perintah:\n*/daftar <NPM> <PASSWORD>*` };
  }

  db.users[senderJid].is_monitoring = true;
  saveV6Db(db);

  return {
    text: `🟢 *Auto-Presensi Diaktifkan!*\n\nBot sekarang aktif memantau presensi Anda secara otomatis.`
  };
}

function handleAbsenStop(senderJid) {
  const db = getV6Db();
  if (!db.users[senderJid]) {
    return { text: `❌ Anda belum mendaftar. Silakan gunakan perintah:\n*/daftar <NPM> <PASSWORD>*` };
  }

  db.users[senderJid].is_monitoring = false;
  saveV6Db(db);

  return {
    text: `🔴 *Auto-Presensi Dinonaktifkan!*\n\nBot berhenti memantau presensi Anda sampai diaktifkan kembali.`
  };
}

function handleAbsenStatus(senderJid) {
  const db = getV6Db();
  const u = db.users[senderJid];
  if (!u) {
    return { text: `❌ Anda belum terdaftar. Silakan daftar menggunakan perintah:\n*/daftar <NPM> <PASSWORD>*` };
  }

  const isMon = u.is_monitoring ? "🟢 Aktif (Memantau)" : "🔴 Nonaktif (Pause)";
  const totalAbsen = u.sudah_absen ? u.sudah_absen.length : 0;

  return {
    text: `📊 *STATUS AUTO-PRESENSI AKUN ANDA*\n\n` +
          `• *NIM/NPM:* \`${u.npm}\`\n` +
          `• *ID Mahasiswa:* \`${u.id_mhs}\`\n` +
          `• *Auto-Monitoring:* ${isMon}\n` +
          `• *Presensi Sukses:* \`${totalAbsen}\` kelas`
  };
}

function handleLogout(senderJid) {
   const db = getV6Db();
   if (!db.users[senderJid]) {
     return { text: `❌ Anda tidak terdaftar dalam sistem bot.` };
   }
 
   const npm = db.users[senderJid].npm;
   delete db.users[senderJid];
   saveV6Db(db);
 
   return {
     text: `🗑️ *Akun Anda (NPM: ${npm}) berhasil dihapus permanen* dari database bot. Sesi monitoring telah dihentikan.`
   };
 }

// --- CICILAN/HUTANG (OWNER ONLY) ---
function handleCicilanTambah(args) {
  if (args.length < 2) {
    return {
      text: `⚠️ Format salah! Gunakan:\n*/cicilan_tambah <nama> <total> [tgl_jatuh_tempo]*\n\nContoh:\n\`/cicilan_tambah mobil 30000000 28\``
    };
  }

  const name = args[0];
  const totalText = args[1];
  const dueDate = args[2] ? parseInt(args[2]) : 28;

  const total = parseAmount(totalText);
  if (total === null || total <= 0) {
    return { text: `❌ Total cicilan tidak valid: *${totalText}*` };
  }

  if (dueDate < 1 || dueDate > 31) {
    return { text: `❌ Tanggal jatuh tempo harus antara 1-31. Gunakan default: */cicilan_tambah ${name} ${totalText}*` };
  }

  const cicilan = addCicilan(name, total, dueDate);

  return {
    text: `✅ *Cicilan Baru Ditambahkan!*\n\n` +
          `🆔 ID: \`${cicilan.id}\`\n` +
          `📋 Nama: *${cicilan.name}*\n` +
          `💰 Total: *${formatRupiah(cicilan.totalAmount)}*\n` +
          `📅 Jatuh Tempo: Tgl *${cicilan.dueDate}* setiap bulan\n` +
          `💾 Terkumpul: *${formatRupiah(cicilan.collected)}*\n` +
          `⏳ Kurang: *${formatRupiah(cicilan.totalAmount - cicilan.collected)}*`
  };
}

function handleCicilanSetor(args) {
  if (args.length < 2) {
    return {
      text: `⚠️ Format salah! Gunakan:\n*/cicilan_setor <id_cicilan> <nominal>*\n\nContoh:\n\`/cicilan_setor cicilan-1685208573210 500k\``
    };
  }

  const cicilan_id = args[0].trim();
  const amountText = args[1];
  const amount = parseAmount(amountText);

  if (amount === null || amount <= 0) {
    return { text: `❌ Nominal tidak valid: *${amountText}*` };
  }

  if (amount > 50000) {
    return { text: `⚠️ Nominal setor lebih dari 50rb (*${formatRupiah(amount)}*). Lanjutkan? Ketik ulang command untuk konfirmasi.` };
  }

  const result = setorCicilan(cicilan_id, amount);
  if (!result) {
    return { text: `❌ Cicilan dengan ID \`${cicilan_id}\` tidak ditemukan. Gunakan */cicilan_list* untuk melihat daftar.` };
  }

  const remaining = result.totalAmount - result.collected;
  let statusMsg = '';
  if (result.status === 'completed') {
    statusMsg = `\n✅ *CICILAN LUNAS!*`;
  } else {
    statusMsg = `\n⏳ *Kurang: ${formatRupiah(remaining)}*`;
  }

  return {
    text: `✅ *Setor Cicilan Berhasil!*\n\n` +
          `📋 Cicilan: *${result.name}*\n` +
          `💵 Setor: *${formatRupiah(amount)}*\n` +
          `💾 Total Terkumpul: *${formatRupiah(result.collected)}* / ${formatRupiah(result.totalAmount)}${statusMsg}`
  };
}

function handleCicilanList() {
  const cicilans = getCicilans();
  if (cicilans.length === 0) {
    return { text: `📜 Belum ada cicilan terdaftar.` };
  }

  let text = `=== 📋 DAFTAR CICILAN ===\n\n`;
  cicilans.forEach(c => {
    const remaining = c.totalAmount - c.collected;
    const progress = Math.round((c.collected / c.totalAmount) * 100);
    const statusIcon = c.status === 'completed' ? '✅' : '⏳';
    
    text += `${statusIcon} *${c.name}*\n` +
            `  ID: \`${c.id}\`\n` +
            `  📅 Jatuh Tempo: Tgl ${c.dueDate}\n` +
            `  💰 Total: ${formatRupiah(c.totalAmount)}\n` +
            `  💾 Terkumpul: ${formatRupiah(c.collected)} (${progress}%)\n` +
            `  ⏳ Kurang: ${formatRupiah(remaining)}\n`;
            
    if (c.status !== 'completed' && remaining > 0) {
      text += `  📊 Estimasi Lunas:\n` +
              `     • 20k/hari: ${Math.ceil(remaining / 20000)} hari\n` +
              `     • 30k/hari: ${Math.ceil(remaining / 30000)} hari\n` +
              `     • 40k/hari: ${Math.ceil(remaining / 40000)} hari\n` +
              `     • 50k/hari: ${Math.ceil(remaining / 50000)} hari\n`;
    }
    text += `\n`;
  });

  return { text: text.trim() };
}

function handleCicilanHapus(args) {
  if (args.length === 0) {
    return { text: `⚠️ Format salah! Gunakan: */cicilan_hapus <id_cicilan>*` };
  }

  const id = args[0].trim();
  const success = deleteCicilan(id);
  if (success) {
    return { text: `✅ Cicilan \`${id}\` berhasil dihapus.` };
  } else {
    return { text: `❌ Cicilan dengan ID \`${id}\` tidak ditemukan.` };
  }
}

// --- TUGAS (OWNER ONLY) ---
function handleTugasTambah(args) {
  if (args.length === 0) {
    return {
      text: `⚠️ Format salah! Gunakan:\n*/tugas_tambah <judul>*\n\nContoh:\n\`/tt Beli buku pelajaran\``
    };
  }

  const title = args.join(' ');
  const task = addTask(title, '', 'medium', null, 'Umum');

  return {
    text: `✅ *Tugas Baru Ditambahkan!*\n\n` +
          `🆔 ID: \`${task.id}\`\n` +
          `📋 Judul: *${task.title}*\n` +
          `⏳ Status: Belum selesai\n\n` +
          `_Gunakan \`/td ${task.id}\` untuk menandai selesai._`
  };
}

function handleTugasList() {
  const tasks = getTasks();
  if (tasks.length === 0) {
    return { text: `📋 Belum ada tugas terdaftar.` };
  }

  const active = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);

  let text = `=== 📋 DAFTAR TUGAS ===\n\n`;

  if (active.length > 0) {
    text += `*⏳ Belum Selesai (${active.length})*\n\n`;
    active.forEach(t => {
      const priorityIcon = t.priority === 'high' ? '🔴' : t.priority === 'medium' ? '🟡' : '🔵';
      text += `${priorityIcon} *${t.title}*\n`;
      text += `  ID: \`${t.id}\`\n`;
      if (t.dueDate) {
        const daysLeft = Math.ceil((new Date(t.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        text += `  📅 ${daysLeft > 0 ? `${daysLeft} hari lagi` : 'Terlambat!'}\n`;
      }
      text += `\n`;
    });
  }

  if (completed.length > 0) {
    text += `*✅ Selesai (${completed.length})*\n\n`;
    completed.forEach(t => {
      text += `✅ ~${t.title}~\n`;
      text += `  ID: \`${t.id}\`\n\n`;
    });
  }

  return { text: text.trim() };
}

function handleTugasDone(args) {
  if (args.length === 0) {
    return { text: `⚠️ Format salah! Gunakan: */tugas_done <id_tugas>*` };
  }

  const id = args[0].trim();
  const task = toggleTask(id);
  if (!task) {
    return { text: `❌ Tugas dengan ID \`${id}\` tidak ditemukan. Gunakan */tl* untuk melihat daftar.` };
  }

  if (task.completed) {
    return { text: `✅ *Tugas Selesai!* 🎉\n\n📋 *${task.title}*\nSelesai pada: ${new Date(task.completedAt).toLocaleString('id-ID')}` };
  } else {
    return { text: `🔄 *Tugas Dibuka Kembali*\n\n📋 *${task.title}*\nStatus: ⏳ Belum selesai` };
  }
}

function handleTugasHapus(args) {
  if (args.length === 0) {
    return { text: `⚠️ Format salah! Gunakan: */tugas_hapus <id_tugas>*` };
  }

  const id = args[0].trim();
  const success = deleteTask(id);
  if (success) {
    return { text: `✅ Tugas \`${id}\` berhasil dihapus.` };
  } else {
    return { text: `❌ Tugas dengan ID \`${id}\` tidak ditemukan.` };
  }
}

// Main Command Handler
export async function handleReportState(msg, messageText, senderJid) {
  const state = reportStates[senderJid];
  if (!state) return null;

  if (messageText.toLowerCase() === '/batal') {
    delete reportStates[senderJid];
    return { text: "❌ Pembuatan laporan dibatalkan." };
  }

  if (state.step === 'LOKASI') {
    if (!messageText) return { text: "⚠️ Tolong kirimkan lokasi kerusakan dalam bentuk teks." };
    state.lokasi = messageText;
    state.step = 'FOTO';
    return { text: "📍 Lokasi tersimpan.\n\nSelanjutnya, silakan kirimkan *FOTO* kerusakan dengan *Judul Laporan* di baris pertama dan *Deskripsi* di baris selanjutnya pada *caption* foto.\n\nContoh Caption:\nAC Rusak\nAir AC menetes sangat deras dari pagi.\n\n_(Ketik /batal untuk membatalkan)_" };
  }

  if (state.step === 'FOTO') {
    const imageMessage = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imageMessage) {
        return { text: "⚠️ Anda harus mengirimkan *FOTO* beserta caption (Judul & Deskripsi)." };
    }
    
    let caption = msg.message?.imageMessage?.caption || messageText;
    if (!caption || caption.trim() === '') {
        return { text: "⚠️ Caption (Judul & Deskripsi) tidak boleh kosong." };
    }
    
    const lines = caption.split('\\n').map(l => l.trim()).filter(l => l !== '');
    const judul = lines[0];
    const deskripsi = lines.slice(1).join('\\n') || '-';

    try {
        const buffer = await downloadMediaMessage(msg, 'buffer', { });
        const filename = 'wa_' + Date.now() + '.jpg';
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        
        const kontak = senderJid.split('@')[0];
        const nama = msg.pushName || kontak;
        
        const result = createGuestReport(nama, kontak, judul, deskripsi, state.lokasi, filename);
        delete reportStates[senderJid];
        
        return { text: `✅ *Laporan Berhasil Dibuat!*\n\nKode Laporan: *${result.kode_laporan}*\n\nTerima kasih telah melaporkan kerusakan. Admin kami akan segera menindaklanjutinya.` };
    } catch(e) {
        console.error("Gagal mendownload gambar:", e);
        return { text: "❌ Terjadi kesalahan saat memproses gambar laporan. Silakan coba lagi." };
    }
  }

  if (state.step === 'FOTO_AI') {
    const imageMessage = msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
    if (!imageMessage) {
        return { text: "⚠️ Anda harus mengirimkan *FOTO* kerusakan tersebut." };
    }
    
    try {
        const buffer = await downloadMediaMessage(msg, 'buffer', { });
        const filename = 'wa_' + Date.now() + '.jpg';
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        
        const kontak = senderJid.split('@')[0];
        const nama = msg.pushName || kontak;
        
        const result = createGuestReport(nama, kontak, state.judul, state.deskripsi, state.lokasi, filename);
        delete reportStates[senderJid];
        
        return { text: `✅ *Laporan Berhasil Dibuat!*\n\nKode Laporan: *${result.kode_laporan}*\n\nTerima kasih telah melaporkan kerusakan. Admin kami akan segera menindaklanjutinya.` };
    } catch(e) {
        console.error("Gagal mendownload gambar:", e);
        return { text: "❌ Terjadi kesalahan saat memproses gambar laporan. Silakan coba lagi." };
    }
  }
}

// Main Command Handler
export async function handleCommand(messageText, senderJid, isOwner) {
  const trimmed = messageText.trim();
  if (!trimmed.startsWith('/')) return null;

  const parts = trimmed.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Periksa apakah ini command khusus owner/privat
  const ownerOnlyCommands = new Set([
    '/masuk', '/in',
    '/keluar', '/out',
    '/saldo', '/s',
    '/rekap', '/r',
    '/riwayat', '/h',
    '/hapus', '/del',
    '/ekspor', '/ex',
    '/pantau_start', '/ps',
    '/pantau_stop', '/pp',
    '/pantau_status', '/pst',
    '/cicilan_tambah', '/ct',
    '/cicilan_setor', '/cs',
    '/cicilan_list', '/cl',
    '/cicilan_hapus', '/ch',
    '/tugas_tambah', '/tt',
    '/tugas_list', '/tl',
    '/tugas_done', '/td',
    '/tugas_hapus', '/th',
  ]);

  if (ownerOnlyCommands.has(command) && !isOwner) {
    return { text: `❌ Hak akses ditolak. Perintah ini hanya bisa dijalankan oleh nomor pemilik bot.` };
  }

  switch (command) {
    // MENU
    case '/lapor':
      reportStates[senderJid] = { step: 'LOKASI' };
      return { text: "📢 *Mulai Pelaporan Kerusakan*\n\nSilakan kirimkan *Lokasi Detail* dari kerusakan tersebut.\nContoh: _Gedung A Lantai 2, Ruang Kelas A201_\n\n_(Ketik /batal untuk membatalkan)_" };

    case '/lapor_ai':
      const aiData = args.join(' ').split('|').map(s => s.trim());
      if (aiData.length >= 3) {
          reportStates[senderJid] = { 
              step: 'FOTO_AI',
              lokasi: aiData[0],
              judul: aiData[1],
              deskripsi: aiData[2]
          };
          return { text: `📋 *Data Laporan Dicatat!*\n\n📍 Lokasi: *${aiData[0]}*\n📌 Laporan: *${aiData[1]}*\n\n📸 Langkah terakhir: Silakan kirimkan **FOTO** kerusakannya ke chat ini (tanpa perlu repot mengetik caption lagi).\n\n_(Ketik /batal jika ingin membatalkan)_` };
      }
      return null;

    case '/menu': case '/m': case '/help': case '/bantuan':
      return { text: isOwner ? getOwnerMenu() : getPublicMenu() };

    // --- KEUANGAN (OWNER ONLY) ---
    case '/masuk': case '/in':
      return handleAdd(args, 'pemasukan');
    case '/keluar': case '/out':
      return handleAdd(args, 'pengeluaran');
    case '/saldo': case '/s':
      return handleShowBalance();
    case '/rekap': case '/r':
      return handleShowSummary(args);
    case '/riwayat': case '/h':
      return handleShowHistory(args);
    case '/hapus': case '/del':
      return handleDeleteMapping(args);
    case '/ekspor': case '/ex':
      return handleExport();

    // --- PRESENSI PRIBADI V5 (OWNER ONLY) ---
    case '/pantau_start': case '/ps':
      return handleOwnerPantauStart();
    case '/pantau_stop': case '/pp':
      return handleOwnerPantauStop();
    case '/pantau_status': case '/pst':
      return handleOwnerPantauStatus();

    // --- PRESENSI UMUM V6 (ALL USERS) ---
    case '/daftar': case '/reg':
      return await handleRegister(senderJid, args);
    case '/absen_start': case '/as':
      return handleAbsenStart(senderJid);
    case '/absen_stop': case '/ap':
      return handleAbsenStop(senderJid);
    case '/absen_status': case '/ast':
      return handleAbsenStatus(senderJid);
    case '/logout': case '/hapus_akun':
      return handleLogout(senderJid);

    // --- CICILAN/HUTANG (OWNER ONLY) ---
    case '/cicilan_tambah': case '/ct':
      return handleCicilanTambah(args);
    case '/cicilan_setor': case '/cs':
      return handleCicilanSetor(args);
    case '/cicilan_list': case '/cl':
      return handleCicilanList();
    case '/cicilan_hapus': case '/ch':
      return handleCicilanHapus(args);

    // --- TUGAS (OWNER ONLY) ---
    case '/tugas_tambah': case '/tt':
      return handleTugasTambah(args);
    case '/tugas_list': case '/tl':
      return handleTugasList();
    case '/tugas_done': case '/td':
      return handleTugasDone(args);
    case '/tugas_hapus': case '/th':
      return handleTugasHapus(args);

    default:
      return { text: `❌ Perintah tidak dikenal: *${command}*\nKetik */m* untuk melihat daftar perintah.` };
  }
}
