import makeWASocket, { useMultiFileAuthState, DisconnectReason, areJidsSameUser } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import express from 'express';
import { handleCommand, handleReportState, reportStates } from './commands.js';
import { startPresensiMonitoring, getOwnerDb, getV6Db } from './presensi.js';
import { askGemini } from './ai.js';
import { getBalance, getSummary, getTransactions, addTransaction, deleteTransaction, getEWallets, addEWallet, deleteEWallet, getCategories, addCategory, deleteCategory, getSixMonthsTrend, getGoals, addGoal, fundGoal, deleteGoal, getExportCSV, getCicilans, addCicilan, setorCicilan, deleteCicilan, deleteCicilanPayment, getCicilanPayments, getTasks, addTask, updateTask, toggleTask, deleteTask, getWeeklyReport, formatRupiah } from './database.js';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const botLogs = [];
const maxLogs = 150;
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

function addLog(type, args) {
  try {
    const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    botLogs.push({ type, time: new Date().toISOString(), message: msg });
    if (botLogs.length > maxLogs) botLogs.shift();
  } catch(e) {}
}

console.log = function(...args) {
  addLog('log', args);
  originalLog.apply(console, args);
};
console.error = function(...args) {
  addLog('error', args);
  originalError.apply(console, args);
};
console.warn = function(...args) {
  addLog('warn', args);
  originalWarn.apply(console, args);
};

// Baileys pino logger stream -> kirim log asli Baileys ke system logs
const baileysLogger = pino({ level: 'info' }, {
  write: (str) => {
    try {
      const obj = JSON.parse(str);
      const msg = obj.msg || JSON.stringify(obj);
      const levelMap = { 10: 'log', 20: 'log', 30: 'log', 40: 'warn', 50: 'error', 60: 'error' };
      const logType = levelMap[obj.level] || 'log';
      addLog(logType, [`[Baileys] ${msg}`]);
    } catch {
      addLog('log', [`[Baileys] ${str.trim()}`]);
    }
  }
});

let waConnectionStatus = 'disconnected';
let waQrData = '';
let waQrImage = '';
let isConnecting = false;
let reconnectTimer = null;

const OWNER_NUMBER = process.env.OWNER_NUMBER;

if (!OWNER_NUMBER) {
  console.error("EROR: OWNER_NUMBER belum dikonfigurasi di file .env!");
  process.exit(1);
}

// Bersihkan nomor pemilik (hanya angka)
let cleanOwner = OWNER_NUMBER.replace(/\D/g, '');
// Konversi format lokal (08xxx) ke internasional (628xxx)
if (cleanOwner.startsWith('0')) {
  cleanOwner = '62' + cleanOwner.slice(1);
}
const ownerJid = `${cleanOwner}@s.whatsapp.net`;

console.log(`Bot dikonfigurasi untuk nomor pemilik: ${cleanOwner} (${ownerJid})`);

let isMonitoringStarted = false;
let globalWaSocket = null;
let lastWeeklyReportDate = null;

// Scheduler Laporan Mingguan Otomatis (Minggu jam 20:00 WIB)
function startWeeklyReportScheduler() {
  setInterval(async () => {
    try {
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      
      // Cek: Hari Minggu (0) jam 20:xx WIB, dan belum kirim hari ini
      if (now.getDay() === 0 && now.getHours() === 20 && now.getMinutes() < 3 && lastWeeklyReportDate !== todayStr) {
        if (globalWaSocket) {
          const report = getWeeklyReport();
          const fromDate = new Date(report.period.from).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
          const toDate = new Date(report.period.to).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

          let catText = '';
          const catEntries = Object.entries(report.categories).sort((a, b) => b[1] - a[1]);
          if (catEntries.length > 0) {
            catText = catEntries.slice(0, 5).map(([cat, amt]) => {
              const name = cat.charAt(0).toUpperCase() + cat.slice(1);
              return `  \u2022 *${name}*: ${formatRupiah(amt)}`;
            }).join('\n');
          } else {
            catText = '  _Tidak ada pengeluaran minggu ini_';
          }

          const balanceIcon = report.balance >= 0 ? '\ud83d\udcc8' : '\ud83d\udcc9';

          const messageText = `\ud83d\udcca *LAPORAN MINGGUAN OTOMATIS*\n` +
            `\ud83d\udcc5 ${fromDate} \u2014 ${toDate}\n` +
            `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n\n` +
            `\ud83d\udce5 Pemasukan: *${formatRupiah(report.income)}*\n` +
            `\ud83d\udce4 Pengeluaran: *${formatRupiah(report.expense)}*\n` +
            `${balanceIcon} Selisih: *${formatRupiah(report.balance)}*\n\n` +
            `\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\u2501\n` +
            `\ud83d\udcca Total Transaksi: *${report.totalTransactions}*\n` +
            `\ud83d\udcb0 Rata-rata/hari: *${formatRupiah(report.dailyAverage)}*\n` +
            `\ud83c\udfc6 Top Pengeluaran: *${report.topCategory.name}* (${formatRupiah(report.topCategory.amount)})\n\n` +
            `*Detail Pengeluaran:*\n${catText}\n\n` +
            `_Laporan ini dikirim otomatis setiap Minggu malam \ud83c\udf19_`;

          await globalWaSocket.sendMessage(ownerJid, { text: messageText });
          lastWeeklyReportDate = todayStr;
          console.log(`[Weekly Report] Laporan mingguan terkirim ke owner.`);
        }
      }
    } catch (err) {
      console.error('[Weekly Report] Error:', err);
    }
  }, 60000); // Cek setiap 60 detik
}

// Setup Express Webhook Server
const app = express();
app.use(express.json());
app.use(cors());
const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3000;

// Serve static frontend web_app if exists
const frontendPath = path.join(__dirname, 'web_app', 'dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));
}

// ==========================================
// API Endpoints for Web Dashboard
// ==========================================
app.get('/api/finance/balance', (req, res) => {
  res.json(getBalance());
});

app.get('/api/finance/summary', (req, res) => {
  const period = req.query.period || 'bulan';
  res.json(getSummary(period));
});

app.get('/api/finance/transactions', (req, res) => {
  const limit = req.query.limit ? parseInt(req.query.limit) : null;
  res.json(getTransactions(limit));
});

app.get('/api/presensi/status', (req, res) => {
  const ownerDb = getOwnerDb();
  const v6Db = getV6Db();
  res.json({ owner: ownerDb, publicUsers: v6Db.users });
});

app.get('/api/logs', (req, res) => {
  res.json(botLogs);
});

app.get('/api/bot/status', (req, res) => {
  res.json({ status: waConnectionStatus, qrCode: waQrData, qrImage: waQrImage });
});

app.post('/api/finance/transaction', (req, res) => {
  const { type, amount, category, description } = req.body;
  if (!type || !amount || !category) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  const tx = addTransaction(type, amount, category, description || '');
  res.json({ success: true, transaction: tx });
});

app.delete('/api/finance/transaction/:id', (req, res) => {
  const success = deleteTransaction(req.params.id);
  if (success) {
    res.json({ success: true, message: 'Transaction deleted' });
  } else {
    res.status(404).json({ error: 'Transaction not found' });
  }
});

app.get('/api/finance/ewallets', (req, res) => {
  res.json(getEWallets());
});

app.post('/api/finance/ewallet', (req, res) => {
  const { name, balance, color } = req.body;
  if (!name || balance === undefined) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  const ew = addEWallet(name, balance, color);
  res.json({ success: true, ewallet: ew });
});

app.delete('/api/finance/ewallet/:id', (req, res) => {
  const success = deleteEWallet(req.params.id);
  if (success) {
    res.json({ success: true, message: 'E-Wallet deleted' });
  } else {
    res.status(404).json({ error: 'E-Wallet not found' });
  }
});

app.get('/api/finance/categories', (req, res) => {
  res.json(getCategories());
});

app.post('/api/finance/category', (req, res) => {
  const { name, type, color } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  const cat = addCategory(name, type, color);
  res.json({ success: true, category: cat });
});

app.delete('/api/finance/category/:id', (req, res) => {
  const success = deleteCategory(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Kategori tidak ditemukan' });
  }
});

app.get('/api/finance/trend', (req, res) => {
  res.json(getSixMonthsTrend());
});

app.get('/api/finance/goals', (req, res) => {
  res.json(getGoals());
});

app.post('/api/finance/goal', (req, res) => {
  const { name, targetAmount, deadline, category, color } = req.body;
  if (!name || !targetAmount || !deadline) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }
  const goal = addGoal(name, targetAmount, deadline, category, color);
  res.json({ success: true, goal });
});

app.post('/api/finance/goal/:id/fund', (req, res) => {
  const { amount } = req.body;
  const goal = fundGoal(req.params.id, amount);
  if (goal) {
    res.json({ success: true, goal });
  } else {
    res.status(404).json({ error: 'Tujuan tidak ditemukan' });
  }
});

app.delete('/api/finance/goal/:id', (req, res) => {
  const success = deleteGoal(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Tujuan tidak ditemukan' });
  }
});

app.get("/api/finance/cicilans", (req, res) => {
  res.json(getCicilans());
});

app.post("/api/finance/cicilan", (req, res) => {
  const { name, totalAmount, dueDate } = req.body;
  if (!name || !totalAmount) {
    return res.status(400).json({ error: "Data tidak lengkap" });
  }
  const cicilan = addCicilan(name, totalAmount, dueDate);
  res.json({ success: true, cicilan });
});

app.post("/api/finance/cicilan/:id/setor", (req, res) => {
  const { amount, date } = req.body;
  const result = setorCicilan(req.params.id, amount, date);
  if (result) {
    res.json({ success: true, cicilan: result.cicilan || result, payment: result.payment });
  } else {
    res.status(404).json({ error: "Cicilan tidak ditemukan" });
  }
});

app.delete("/api/finance/cicilan/:id/payment", (req, res) => {
  const { paymentId, date, amount } = req.body;
  const cicilan = deleteCicilanPayment(req.params.id, paymentId, date, amount);
  if (cicilan) {
    res.json({ success: true, cicilan });
  } else {
    res.status(404).json({ error: "Pembayaran tidak ditemukan" });
  }
});

app.delete("/api/finance/cicilan/:id", (req, res) => {
  const success = deleteCicilan(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: "Cicilan tidak ditemukan" });
  }
});

app.get("/api/finance/cicilan/:id/payments", (req, res) => {
  const payments = getCicilanPayments(req.params.id);
  if (payments !== null) {
    res.json(payments);
  } else {
    res.status(404).json({ error: "Cicilan tidak ditemukan" });
  }
});

app.get('/api/finance/export', (req, res) => {
  const csv = getExportCSV();
  if (csv) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="transaksi-keuangan.csv"');
    res.send(csv);
  } else {
    res.status(400).json({ error: 'Tidak ada transaksi untuk diekspor' });
  }
});

app.get('/api/finance/weekly-report', (req, res) => {
  res.json(getWeeklyReport());
});
// ==========================================
// TASK MANAGEMENT API
// ==========================================
app.get('/api/tasks', (req, res) => {
  res.json(getTasks());
});

app.post('/api/tasks', (req, res) => {
  const { title, description, priority, dueDate, category } = req.body;
  if (!title) {
    return res.status(400).json({ error: 'Judul tugas wajib diisi' });
  }
  const task = addTask(title, description, priority, dueDate, category);
  res.json({ success: true, task });
});

app.put('/api/tasks/:id', (req, res) => {
  const task = updateTask(req.params.id, req.body);
  if (task) {
    res.json({ success: true, task });
  } else {
    res.status(404).json({ error: 'Tugas tidak ditemukan' });
  }
});

app.patch('/api/tasks/:id/toggle', (req, res) => {
  const task = toggleTask(req.params.id);
  if (task) {
    res.json({ success: true, task });
  } else {
    res.status(404).json({ error: 'Tugas tidak ditemukan' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  const success = deleteTask(req.params.id);
  if (success) {
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Tugas tidak ditemukan' });
  }
});
// ==========================================

// SPA Fallback: serve index.html for all non-API routes
app.use((req, res, next) => {
  // Skip API and webhook routes, and non-GET requests
  if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/webhook')) {
    return next();
  }
  const indexPath = path.join(__dirname, 'web_app', 'dist', 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    next();
  }
});

app.post('/webhook/appsheet', async (req, res) => {
  try {
    console.log(`[Webhook] Menerima data request:`, req.body);

    // Mendukung format kustom kita (nomor, pelapor) ATAU format bawaan AppSheet (NO_WA, PELAPOR)
    const nomor = req.body.nomor || req.body.NO_WA;
    const pelapor = req.body.pelapor || req.body.PELAPOR;
    const barang = req.body.barang || req.body.NAMA_BARANG;
    const status = req.body.status || req.body.STATUS;
    const tanggal = req.body.tanggal || req.body.TANGGAL;

    if (!nomor || !pelapor || !barang || !status) {
      console.warn('[Webhook] Ditolak: Data tidak lengkap (nomor, pelapor, barang, status wajib ada).');
      return res.status(400).json({ error: 'Data tidak lengkap' });
    }

    // Format nomor WA
    let cleanNomor = nomor.toString().replace(/\D/g, '');
    
    // Validasi: Cegah masuknya nomor tidak valid seperti 'NaN' atau teks kosong
    if (cleanNomor.length < 5) {
      console.warn(`[Webhook] Ditolak: Nomor WA tidak valid (${nomor}).`);
      return res.status(400).json({ error: 'Nomor WA tidak valid' });
    }

    if (cleanNomor.startsWith('0')) {
      cleanNomor = '62' + cleanNomor.slice(1);
    } else if (!cleanNomor.startsWith('62')) {
      cleanNomor = '62' + cleanNomor;
    }
    const targetJid = `${cleanNomor}@s.whatsapp.net`;

    const messageText = `UPDATE LAPORAN KERUSAKAN\n\nStatus laporan:\n${barang}\n\nTelah diperbarui menjadi:\n✅ ${status}\n\nTanggal:\n${tanggal || '-'}\n\nTerima kasih.`;

    if (globalWaSocket) {
      await globalWaSocket.sendMessage(targetJid, { text: messageText });
      console.log(`[Webhook] Notifikasi dikirim ke ${cleanNomor}`);
      res.status(200).json({ success: true, message: 'Notifikasi terkirim' });
    } else {
      console.warn('[Webhook] Bot WA belum terhubung, tidak dapat mengirim notifikasi');
      res.status(503).json({ error: 'Bot WA belum siap' });
    }
  } catch (error) {
    console.error('[Webhook] Terjadi kesalahan:', error);
    res.status(500).json({ error: 'Kesalahan internal server' });
  }
});

app.listen(WEBHOOK_PORT, () => {
  console.log(`[Webhook] Server mendengarkan webhook di port ${WEBHOOK_PORT}`);
});

async function connectToWhatsApp() {
  if (isConnecting) {
    console.log('[Baileys] Proses koneksi sedang berjalan, lewati pemicu ganda.');
    return;
  }
  isConnecting = true;

  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger: baileysLogger
  });

  const safeSendPresence = async (presence, jid) => {
    try {
      await sock.sendPresenceUpdate(presence, jid);
    } catch (err) {
      console.warn(`[Presence Warning] Gagal mengirim status presence ${presence}: ${err.message}`);
    }
  };

  const safeSendMessage = async (jid, content, options) => {
    try {
      return await sock.sendMessage(jid, content, options);
    } catch (err) {
      console.error(`[Message Error] Gagal mengirim pesan ke ${jid}: ${err.message}`);
    }
  };

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      waConnectionStatus = 'qr';
      waQrData = qr;
      try {
        waQrImage = await QRCode.toDataURL(qr);
      } catch (err) {
        waQrImage = '';
      }
      console.clear();
      console.log('==================================================');
      console.log('SCAN QR CODE BERIKUT UNTUK MENGHUBUNGKAN BOT WA:');
      console.log('==================================================\n');
      qrcode.generate(qr, { small: true });
      console.log('\n==================================================');
      console.log('Buka WhatsApp -> Perangkat Tertaut -> Tautkan Perangkat');
      console.log('==================================================');
    }

    if (connection === 'close') {
      waConnectionStatus = 'disconnected';
      waQrData = '';
      waQrImage = '';
      globalWaSocket = null;
      isConnecting = false;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`[Baileys] Koneksi terputus (Status: ${statusCode || 'unknown'}). Reconnect: ${shouldReconnect}`);
      
      if (shouldReconnect) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          console.log('[Baileys] Mencoba menghubungkan kembali ke WhatsApp...');
          connectToWhatsApp();
        }, 5000);
      } else {
        console.log('[Baileys] Sesi keluar. Hapus folder auth_info_baileys dan scan QR ulang jika ingin masuk.');
      }
    } else if (connection === 'open') {
      isConnecting = false;
      waConnectionStatus = 'connected';
      waQrData = '';
      waQrImage = '';
      globalWaSocket = sock;
      console.clear();
      console.log('==================================================');
      console.log('🎉 BOT WHATSAPP KEUANGAN & PRESENSI AKTIF!');
      console.log(`👤 Owner Number: ${cleanOwner}`);
      console.log('==================================================');
      console.log('Menunggu pesan masuk dari owner/publik...');

      if (!isMonitoringStarted) {
        isMonitoringStarted = true;
        startPresensiMonitoring(async (jid, text) => {
          try {
            await sock.sendMessage(jid, { text });
          } catch (err) {
            console.error(`Gagal mengirim notif WA ke ${jid}:`, err);
          }
        });
        
        // Jalankan scheduler laporan mingguan
        startWeeklyReportScheduler();
        console.log('[Weekly Report] Scheduler laporan mingguan aktif (Minggu 20:00 WIB).');
      }
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      const senderJid = msg.key.remoteJid;
      
      // Dapatkan teks pesan (termasuk caption gambar)
      const messageText = (
        msg.message?.conversation || 
        msg.message?.extendedTextMessage?.text || 
        msg.message?.imageMessage?.caption ||
        ''
      ).trim();

      // Deteksi apakah ada gambar
      const hasImage = !!(msg.message?.imageMessage || msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage);

      if (!messageText && !hasImage) {
        continue;
      }

      // Log untuk debugging agar tahu pesan apa saja yang dideteksi
      const senderJidAlt = msg.key.remoteJidAlt;
      console.log(`[Pesan Terdeteksi] JID: ${senderJid} ${senderJidAlt ? `(${senderJidAlt})` : ''} | fromMe: ${msg.key.fromMe} | Teks: "${messageText}"`);

      // Cek apakah chat ini melibatkan nomor pemilik
      const isOwnerChat = areJidsSameUser(senderJid, ownerJid) || 
                          (senderJidAlt && areJidsSameUser(senderJidAlt, ownerJid));

      // Cek apakah chat ini melibatkan nomor pacar (+62 831-9110-9108)
      const gfJid = '6283191109108@s.whatsapp.net';
      const isGfChat = areJidsSameUser(senderJid, gfJid) || 
                        (senderJidAlt && areJidsSameUser(senderJidAlt, gfJid));

      // Jika dariMe, kita hanya proses jika ini adalah chat owner dengan dirinya sendiri (self-chat).
      // Untuk orang lain, dariMe = true berarti pesan balasan dari bot kita sendiri ke orang tersebut.
      if (msg.key.fromMe && !isOwnerChat) {
        continue;
      }

      // 0. Cek State Laporan
      if (reportStates[senderJid]) {
        console.log(`[Proses State Laporan] ${new Date().toLocaleTimeString('id-ID')} | JID: ${senderJid}`);
        try {
          await safeSendPresence('composing', senderJid);
          const reply = await handleReportState(msg, messageText, senderJid, safeSendMessage);
          if (reply && reply.text) {
             await safeSendMessage(senderJid, { text: reply.text }, { quoted: msg });
          }
        } catch (err) {
          console.error('Error saat memproses state laporan:', err);
        } finally {
          await safeSendPresence('paused', senderJid);
        }
        continue; // jangan proses sebagai command lain atau AI
      }

      // 1. Kasus Perintah (dimulai dengan '/')
      if (messageText.startsWith('/')) {
        console.log(`[Proses Perintah] ${new Date().toLocaleTimeString('id-ID')} | Perintah: ${messageText}`);

        try {
          // Tampilkan indikator sedang mengetik (typing...)
          await safeSendPresence('composing', senderJid);

          const reply = await handleCommand(messageText, senderJid, isOwnerChat);

          if (reply) {
            if (reply.document) {
              // Kirim file laporan keuangan (CSV)
              await safeSendMessage(senderJid, {
                document: reply.document,
                fileName: reply.fileName,
                mimetype: reply.mimetype,
                caption: 'Berikut adalah berkas laporan keuangan Anda dalam format CSV.'
              }, { quoted: msg });
            } else if (reply.text) {
              // Kirim pesan balasan teks biasa
              await safeSendMessage(senderJid, { text: reply.text }, { quoted: msg });
            }
          }
        } catch (err) {
          console.error('Error saat memproses perintah:', err);
          await safeSendMessage(senderJid, { 
            text: `❌ Terjadi kesalahan saat memproses perintah:\n_${err.message}_` 
          }, { quoted: msg });
        } finally {
          // Matikan status mengetik
          await safeSendPresence('paused', senderJid);
        }
      } 
      // 2. Kasus Chat AI Biasa (tidak dimulai dengan '/')
      else {
        const isPrivateChat = senderJid.endsWith('@s.whatsapp.net') || senderJid.endsWith('@lid');
        
        if (isPrivateChat) {
          console.log(`[Proses AI] ${new Date().toLocaleTimeString('id-ID')} | Prompt: ${messageText}`);
          
          try {
            // Tampilkan indikator sedang mengetik (typing...)
            await safeSendPresence('composing', senderJid);

            const aiReplyText = await askGemini(messageText, isOwnerChat, isGfChat);
            if (aiReplyText) {
              await safeSendMessage(senderJid, { text: aiReplyText }, { quoted: msg });

              // Cek apakah AI memberikan perintah di dalam balasannya
              const lines = aiReplyText.split('\n');
              for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith('/')) {
                  console.log(`[AI Command Terdeteksi] Mengeksekusi: ${trimmedLine}`);
                  try {
                    const reply = await handleCommand(trimmedLine, senderJid, isOwnerChat);
                    if (reply) {
                      if (reply.document) {
                        await safeSendMessage(senderJid, {
                          document: reply.document,
                          fileName: reply.fileName,
                          mimetype: reply.mimetype,
                          caption: 'Berikut adalah berkas laporan keuangan Anda dalam format CSV.'
                        }, { quoted: msg });
                      } else if (reply.text) {
                        await safeSendMessage(senderJid, { text: reply.text }, { quoted: msg });
                      }
                    }
                  } catch (cmdErr) {
                    console.error('Error saat mengeksekusi AI command:', cmdErr);
                  }
                }
              }
            }
          } catch (err) {
            console.error('Error saat memproses AI:', err);
          } finally {
            // Matikan status mengetik
            await safeSendPresence('paused', senderJid);
          }
        }
      }
    }
  });
}

connectToWhatsApp().catch(err => {
  console.error("Gagal menjalankan bot WhatsApp:", err);
});
