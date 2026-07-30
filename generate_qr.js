import QRCode from 'qrcode';

// GANTI DENGAN NOMOR WHATSAPP BOT ANDA (Gunakan format 628...)
// Contoh: const nomorBot = "6281234567890";
const nomorBot = "6289505973409"; 

// Pesan yang akan otomatis terisi saat QR discan
const pesan = "/lapor";

const url = `https://wa.me/${nomorBot}?text=${encodeURIComponent(pesan)}`;

QRCode.toFile('../qr_lapor.png', url, {
  color: {
    dark: '#020617', // Warna gelap
    light: '#ffffff' // Background putih
  },
  width: 500,
  margin: 2
}, function (err) {
  if (err) throw err;
  console.log('✅ Berhasil! QR Code telah dibuat di folder utama: qr_lapor.png');
});
