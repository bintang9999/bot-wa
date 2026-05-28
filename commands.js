import { 
  addTransaction, 
  getTransactions, 
  deleteTransaction, 
  getBalance, 
  getSummary, 
  getExportCSV, 
  formatRupiah 
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

💵 *Manajemen Keuangan*

• \`/masuk <jumlah> <kategori> <keterangan>\`
Catat pemasukan
Contoh:
\`/masuk 1.5jt gaji\`

• \`/keluar <jumlah> <kategori> <keterangan>\`
Catat pengeluaran
Contoh:
\`/keluar 50k makan\`

• \`/saldo\`
Lihat saldo dan ringkasan keuangan

• \`/rekap [hari|minggu|bulan]\`
Lihat laporan transaksi

• \`/riwayat [jumlah]\`
Transaksi terakhir
Contoh:
\`/riwayat 10\`

• \`/hapus <id>\`
Hapus transaksi

• \`/ekspor\`
Export laporan CSV/Excel

──────────────────

🎓 *Auto Presensi*

• \`/pantau_start\`
Aktifkan monitoring presensi owner

• \`/pantau_stop\`
Hentikan monitoring

• \`/pantau_status\`
Cek status monitoring

──────────────────

👥 *Presensi User*

• \`/daftar <npm> <password>\`
Simpan akun presensi

• \`/absen_start\`
Aktifkan auto absen

• \`/absen_stop\`
Matikan auto absen

• \`/absen_status\`
Lihat status akun

• \`/logout\`
Hapus data akun dari bot

──────────────────

💡 Tips:
Klik atau ketik command untuk menjalankan fitur.`;
}

// Menu bantuan Publik (v6)
function getPublicMenu() {
  return `╭─〔 HI SELAMAT DATANG 〕─╮
│ 
╰───────────────╯

👥 *Presensi User*

• \`/daftar <npm> <password>\`
Simpan akun presensi

• \`/absen_start\`
Aktifkan auto absen

• \`/absen_stop\`
Matikan auto absen

• \`/absen_status\`
Lihat status akun

• \`/logout\`
Hapus data akun dari bot

──────────────────

💡 Tips:
Klik atau ketik command untuk menjalankan fitur.`;
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

// Main Command Handler
export async function handleCommand(messageText, senderJid, isOwner) {
  const trimmed = messageText.trim();
  if (!trimmed.startsWith('/')) return null;

  const parts = trimmed.split(/\s+/);
  const command = parts[0].toLowerCase();
  const args = parts.slice(1);

  // Periksa apakah ini command khusus owner/privat
  const ownerCommands = [
    '/masuk', '/keluar', '/saldo', '/rekap', '/riwayat', '/hapus', '/ekspor',
    '/pantau_start', '/pantau_stop', '/pantau_status'
  ];

  if (ownerCommands.includes(command) && !isOwner) {
    return { text: `❌ Hak akses ditolak. Perintah ini hanya bisa dijalankan oleh nomor pemilik bot.` };
  }

  switch (command) {
    case '/menu':
    case '/help':
    case '/bantuan':
      return { text: isOwner ? getOwnerMenu() : getPublicMenu() };

    // --- KEUANGAN (OWNER ONLY) ---
    case '/masuk':
      return handleAdd(args, 'pemasukan');
    case '/keluar':
      return handleAdd(args, 'pengeluaran');
    case '/saldo':
      return handleShowBalance();
    case '/rekap':
      return handleShowSummary(args);
    case '/riwayat':
      return handleShowHistory(args);
    case '/hapus':
      return handleDeleteMapping(args);
    case '/ekspor':
      return handleExport();

    // --- PRESENSI PRIBADI V5 (OWNER ONLY) ---
    case '/pantau_start':
      return handleOwnerPantauStart();
    case '/pantau_stop':
      return handleOwnerPantauStop();
    case '/pantau_status':
      return handleOwnerPantauStatus();

    // --- PRESENSI UMUM V6 (ALL USERS) ---
    case '/daftar':
      return await handleRegister(senderJid, args);
    case '/absen_start':
      return handleAbsenStart(senderJid);
    case '/absen_stop':
      return handleAbsenStop(senderJid);
    case '/absen_status':
      return handleAbsenStatus(senderJid);
    case '/logout':
    case '/hapus_akun':
      return handleLogout(senderJid);

    default:
      return { text: `❌ Perintah tidak dikenal: *${command}*\nKetik */menu* untuk melihat daftar perintah.` };
  }
}
