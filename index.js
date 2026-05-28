import makeWASocket, { useMultiFileAuthState, DisconnectReason, areJidsSameUser } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import dotenv from 'dotenv';
import { handleCommand } from './commands.js';
import { startPresensiMonitoring } from './presensi.js';
import { askGemini } from './ai.js';

dotenv.config();

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

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false, // Kita cetak secara manual di bawah agar lebih rapi
    logger: pino({ level: 'silent' }) // Kurangi log yang tidak perlu agar terminal bersih
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

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
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
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log(`Koneksi terputus. Mencoba menghubungkan kembali: ${shouldReconnect}`);
      if (shouldReconnect) {
        connectToWhatsApp();
      } else {
        console.log('Bot keluar dari sesi WhatsApp. Jalankan kembali untuk menghubungkan ulang.');
      }
    } else if (connection === 'open') {
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
      }
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    if (m.type !== 'notify') return;

    for (const msg of m.messages) {
      const senderJid = msg.key.remoteJid;
      
      // Dapatkan teks pesan
      const messageText = (
        msg.message?.conversation || 
        msg.message?.extendedTextMessage?.text || 
        ''
      ).trim();

      if (!messageText) {
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
