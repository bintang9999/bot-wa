import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import * as cheerio from 'cheerio';

const BASE_URL = "https://raising.almaata.ac.id";
const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "X-Requested-With": "XMLHttpRequest",
  "Accept": "application/json, text/javascript, */*; q=0.01",
  "Origin": BASE_URL
};

// Lokasi database data
const DATA_DIR = path.resolve('data');
const DB_V6_PATH = path.join(DATA_DIR, 'presensi_db.json');
const DB_V5_PATH = path.join(DATA_DIR, 'presensi_owner.json');

// Pastikan folder data ada
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Inisialisasi basis data jika belum ada
if (!fs.existsSync(DB_V6_PATH)) {
  fs.writeFileSync(DB_V6_PATH, JSON.stringify({ users: {} }, null, 2));
}
if (!fs.existsSync(DB_V5_PATH)) {
  fs.writeFileSync(DB_V5_PATH, JSON.stringify({ is_monitoring: false, sudah_absen: [] }, null, 2));
}

// Helper MD5 Hash
export function getMd5(text) {
  return crypto.createHash('md5').update(text).digest('hex');
}

// -------------------------------------------------------------
// KELAS SESSION: Mengelola Cookie dan Request (seperti requests.Session() Python)
// -------------------------------------------------------------
export class Session {
  constructor() {
    this.cookies = {};
  }

  getCookieString() {
    return Object.entries(this.cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join('; ');
  }

  updateCookies(res) {
    let cookies = [];
    if (typeof res.headers.getSetCookie === 'function') {
      cookies = res.headers.getSetCookie();
    } else {
      const setCookieVal = res.headers.get('set-cookie');
      if (setCookieVal) {
        cookies = setCookieVal.split(/,(?=\s*[a-zA-Z0-9_]+=)/);
      }
    }

    cookies.forEach(cookieStr => {
      const parts = cookieStr.split(';')[0].split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        this.cookies[key] = value;
      }
    });
  }

  async request(url, options = {}) {
    options.headers = options.headers || {};
    Object.assign(options.headers, HEADERS);

    if (Object.keys(this.cookies).length > 0) {
      options.headers['Cookie'] = this.getCookieString();
    }

    const res = await fetch(url, options);
    this.updateCookies(res);
    return res;
  }

  async get(url, options = {}) {
    options.method = 'GET';
    return this.request(url, options);
  }

  async post(url, data = null, options = {}) {
    options.method = 'POST';
    options.headers = options.headers || {};
    if (data && typeof data === 'object') {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(data)) {
        params.append(k, v);
      }
      options.body = params;
      options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    } else if (data) {
      options.body = data;
    }
    return this.request(url, options);
  }
}

// Cache Sesi & Namespace di dalam RAM
const ACTIVE_SESSIONS = {}; // { jid: Session }
const ACTIVE_NAMESPACES = {}; // { jid: namespace_string }

// -------------------------------------------------------------
// CORE SCRAPER LOGIC (PORTING DARI PYTHON V5 & V6)
// -------------------------------------------------------------

// Sinkronisasi Sesi dan Namespace Login Portal
export async function syncSessionAndNamespace(session, f1, f2) {
  const url_form = `${BASE_URL}/welcome`;
  let url_post = `${BASE_URL}/auth/login`;

  try {
    const resGet = await session.get(url_form);
    if (resGet.status !== 200) return { namespace: null, success: false };

    const html = await resGet.text();
    const $ = cheerio.load(html);

    // Ambil token CSRF dari HTML form
    let token = $('input[name="csrf_test_name"]').val();
    if (!token) {
      token = session.cookies['csrf_cookie_name'];
      if (!token) return { namespace: null, success: false };
    }

    // Ambil endpoint form login yang sesungguhnya
    const loginForm = $('form');
    if (loginForm.length && loginForm.attr('action')) {
      const action = loginForm.attr('action');
      url_post = action.startsWith('http') ? action : `${BASE_URL}/${action.replace(/^\//, '')}`;
    }

    // Eksekusi POST Login
    const payload = {
      'csrf_test_name': token,
      'f1': f1,
      'f2': f2,
      'slogin': 'LOGIN'
    };

    const resPost = await session.post(url_post, payload, {
      headers: { "Referer": url_form }
    });

    const bodyText = await resPost.text();

    // Verifikasi keberhasilan login (cek cookie ci_session dan teks logout)
    if (session.cookies['ci_session'] && bodyText.toLowerCase().includes('logout')) {
      // Ekstrak namespace dari redirect URL
      const match = resPost.url.match(/almaata\.ac\.id\/([a-f0-9]{32,40})\//);
      if (match) {
        return { namespace: match[1], success: true };
      }
    }
    return { namespace: null, success: false };
  } catch (error) {
    console.error('Error saat login sinkronisasi:', error);
    return { namespace: null, success: false };
  }
}

// Ambil ID Mahasiswa otomatis dari dashboard presensi
export async function extractIdMahasiswa(session, namespace) {
  try {
    const url_dashboard = `${BASE_URL}/${namespace}/dashboard/perkuliahan/presensi`;
    const res = await session.get(url_dashboard);
    if (res.status !== 200) return null;

    const html = await res.text();
    const $ = cheerio.load(html);

    // 1. Cari berdasarkan input nama "id_mahasiswa"
    const inputVal = $('input[name="id_mahasiswa"]').val();
    if (inputVal && /^\d+$/.test(inputVal.trim())) {
      return inputVal.trim();
    }

    // 2. Regex fallback jika input tidak ditemukan
    const match1 = html.match(/name="id_mahasiswa"\s+value="(\d+)"/i);
    if (match1) return match1[1];

    const match2 = html.match(/id_mahasiswa\s*:\s*["']?(\d+)/i);
    if (match2) return match2[1];

    return null;
  } catch (error) {
    console.error('Error saat ekstraksi ID Mahasiswa:', error);
    return null;
  }
}

// Kirim request absensi (Tembak Presensi)
export async function tembakPresensi(session, id_mahasiswa, namespace, id_pertemuan, kode_presensi) {
  try {
    // 1. Kunjungi dashboard untuk memicu rotasi token CSRF baru
    const url_dashboard = `${BASE_URL}/${namespace}/dashboard/perkuliahan/presensi`;
    await session.get(url_dashboard);

    const token = session.cookies['csrf_cookie_name'];
    const url_api = `${BASE_URL}/${namespace}/api/perkuliahan/create_presensi_mahasiswa_by_kode/${id_pertemuan}`;

    const payload = {
      "id_mahasiswa": id_mahasiswa,
      "kode_presensi": kode_presensi,
      "csrf_test_name": token
    };

    const res = await session.post(url_api, payload, {
      headers: { "Referer": url_dashboard }
    });

    const resJson = await res.json();
    return {
      success: !!(resJson.status || (resJson.message && resJson.message.toLowerCase().includes('berhasil'))),
      message: resJson.message || 'No Message'
    };
  } catch (error) {
    console.error('Error saat submit presensi:', error);
    return { success: false, message: error.message };
  }
}

// -------------------------------------------------------------
// MANAJEMEN DATABASE
// -------------------------------------------------------------

// DB V5 (Pribadi / Owner)
export function getOwnerDb() {
  try {
    return JSON.parse(fs.readFileSync(DB_V5_PATH, 'utf-8'));
  } catch (e) {
    return { is_monitoring: false, sudah_absen: [] };
  }
}

export function saveOwnerDb(data) {
  try {
    fs.writeFileSync(DB_V5_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Gagal menyimpan DB v5:', e);
  }
}

// DB V6 (Publik / Multi-User)
export function getV6Db() {
  try {
    return JSON.parse(fs.readFileSync(DB_V6_PATH, 'utf-8'));
  } catch (e) {
    return { users: {} };
  }
}

export function saveV6Db(data) {
  try {
    fs.writeFileSync(DB_V6_PATH, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Gagal menyimpan DB v6:', e);
  }
}

// -------------------------------------------------------------
// CORE BACKGROUND MONITORING LOOPS
// -------------------------------------------------------------
let waSenderCallback = null;

// Fungsi Utama Pemantauan Presensi (Owner + Publik)
export function startPresensiMonitoring(sendWACallback) {
  waSenderCallback = sendWACallback;

  console.log("⚡ Sistem Auto-Presensi Alma Ata diaktifkan di latar belakang...");

  // Jalankan monitor Owner (v5)
  runOwnerMonitoringLoop();

  // Jalankan monitor Publik (v6)
  runV6MonitoringLoop();
}

// 1. Loop Pemantauan Pribadi (v5)
async function runOwnerMonitoringLoop() {
  while (true) {
    try {
      const ownerDb = getOwnerDb();
      if (!ownerDb.is_monitoring) {
        // Jika tidak aktif, cek kembali setiap 30 detik
        await sleep(30000);
        continue;
      }

      // Kredensial owner dari env
      const f1 = process.env.F1_VALUE;
      const f2 = process.env.F2_VALUE;
      const id_mhs = process.env.ID_MHS;
      const ownerJid = `${process.env.OWNER_NUMBER.replace(/\D/g, '')}@s.whatsapp.net`;

      if (!f1 || !f2 || !id_mhs) {
        console.error("⚠️ Kredensial presensi pribadi Owner di .env tidak lengkap!");
        await sleep(60000);
        continue;
      }

      const jidKey = 'owner_v5';
      if (!ACTIVE_SESSIONS[jidKey]) {
        ACTIVE_SESSIONS[jidKey] = new Session();
      }

      const session = ACTIVE_SESSIONS[jidKey];
      let namespace = ACTIVE_NAMESPACES[jidKey];

      // Login jika belum ada namespace
      if (!namespace) {
        console.log(`[Pribadi] Sinkronisasi sesi portal owner...`);
        const loginRes = await syncSessionAndNamespace(session, f1, f2);
        if (loginRes.success) {
          namespace = loginRes.namespace;
          ACTIVE_NAMESPACES[jidKey] = namespace;
        } else {
          console.error(`[Pribadi] Gagal login portal owner. Mencoba lagi nanti.`);
          await sleep(60000);
          continue;
        }
      }

      // Fetch daftar kehadiran
      const api_url = `${BASE_URL}/${namespace}/api/datatable/perkuliahan/daftar_pertemuan_presensi_mahasiswa/${id_mhs}`;
      let res;
      try {
        res = await session.get(api_url + '?length=15');
      } catch (err) {
        console.error(`[Pribadi] Sesi request timeout, re-login.`);
        ACTIVE_NAMESPACES[jidKey] = null;
        await sleep(30000);
        continue;
      }

      if (res.status !== 200 || !res.headers.get('content-type')?.includes('json')) {
        // Sesi habis, hapus namespace agar login ulang di loop berikutnya
        console.log(`[Pribadi] Sesi kedaluwarsa. Login ulang...`);
        ACTIVE_NAMESPACES[jidKey] = null;
        continue;
      }

      const resJson = await res.json();
      const data = resJson.data || [];
      let dbUpdated = false;

      for (const meeting of data) {
        const idp = String(meeting.id_pertemuan_presensi);
        const matkul = meeting.nama_matakuliah;
        const kode = meeting.kode;
        const isDone = String(meeting.status_presensi || "0");

        // Cek jika kode ada, belum absen di web, dan belum dicatat sukses oleh bot
        if (kode && kode !== "-" && isDone === "0" && !ownerDb.sudah_absen.includes(idp)) {
          console.log(`🎯 [Pribadi] Menemukan kelas aktif: ${matkul} (Kode: ${kode}). Mengeksekusi...`);
          
          const shot = await tembakPresensi(session, id_mhs, namespace, idp, kode);
          if (shot.success) {
            ownerDb.sudah_absen.push(idp);
            saveOwnerDb(ownerDb);
            dbUpdated = true;

            // Kirim notif WA ke Owner
            if (waSenderCallback) {
              await waSenderCallback(ownerJid, `✅ *AUTO PRESENSI PRIBADI BERHASIL*\n\n📚 Matkul: *${matkul}*\n🔑 Kode Absen: \`${kode}\``);
            }
          } else {
            console.error(`[Pribadi] Presensi ditolak server untuk ${matkul}: ${shot.message}`);
            if (waSenderCallback) {
              await waSenderCallback(ownerJid, `⚠️ *AUTO PRESENSI PRIBADI DITOLAK*\n\n📚 Matkul: *${matkul}*\n💬 Response: _${shot.message}_`);
            }
          }
        }
      }

      // Random delay 2-3 menit (120-180 detik)
      const delay = Math.floor(Math.random() * (180 - 120 + 1) + 120) * 1000;
      await sleep(delay);

    } catch (e) {
      console.error("⚠️ Error di Loop Presensi Pribadi:", e);
      await sleep(30000);
    }
  }
}

// 2. Loop Pemantauan Publik/Multi-User (v6)
async function runV6MonitoringLoop() {
  while (true) {
    try {
      const db = getV6Db();
      const users = db.users || {};
      const activeJids = Object.keys(users).filter(jid => users[jid].is_monitoring);

      if (activeJids.length === 0) {
        // Jika tidak ada user aktif, standby cek tiap 1 menit
        await sleep(60000);
        continue;
      }

      for (const jid of activeJids) {
        const u = users[jid];
        const { npm, f1, f2, id_mhs } = u;
        const sudah_absen = u.sudah_absen || [];

        if (!ACTIVE_SESSIONS[jid]) {
          ACTIVE_SESSIONS[jid] = new Session();
        }

        const session = ACTIVE_SESSIONS[jid];
        let namespace = ACTIVE_NAMESPACES[jid];

        // Login jika belum ada namespace
        if (!namespace) {
          console.log(`[Umum] Sinkronisasi sesi portal untuk JID: ${jid} (NPM: ${npm})...`);
          const loginRes = await syncSessionAndNamespace(session, f1, f2);
          if (loginRes.success) {
            namespace = loginRes.namespace;
            ACTIVE_NAMESPACES[jid] = namespace;
          } else {
            console.error(`[Umum] NPM ${npm} gagal login. Dilewati.`);
            continue;
          }
        }

        // Fetch daftar kehadiran
        const api_url = `${BASE_URL}/${namespace}/api/datatable/perkuliahan/daftar_pertemuan_presensi_mahasiswa/${id_mhs}`;
        let res;
        try {
          res = await session.get(api_url + '?length=15');
        } catch (err) {
          console.error(`[Umum] NPM ${npm} request timeout, re-login.`);
          ACTIVE_NAMESPACES[jid] = null;
          continue;
        }

        if (res.status !== 200 || !res.headers.get('content-type')?.includes('json')) {
          console.log(`[Umum] NPM ${npm} sesi kedaluwarsa. Login ulang...`);
          ACTIVE_NAMESPACES[jid] = null;
          continue;
        }

        const resJson = await res.json();
        const data = resJson.data || [];
        let userDbUpdated = false;

        for (const meeting of data) {
          const idp = String(meeting.id_pertemuan_presensi);
          const matkul = meeting.nama_matakuliah;
          const kode = meeting.kode;
          const isDone = String(meeting.status_presensi || "0");

          if (kode && kode !== "-" && isDone === "0" && !sudah_absen.includes(idp)) {
            console.log(`🎯 [Umum] Menemukan kelas aktif NPM ${npm}: ${matkul} (Kode: ${kode}).`);
            
            const shot = await tembakPresensi(session, id_mhs, namespace, idp, kode);
            if (shot.success) {
              // Simpan status sukses ke DB
              const latestDb = getV6Db();
              if (latestDb.users[jid]) {
                latestDb.users[jid].sudah_absen.push(idp);
                saveV6Db(latestDb);
                userDbUpdated = true;
              }

              // Kirim notifikasi WA ke User
              if (waSenderCallback) {
                await waSenderCallback(jid, `✅ *AUTO PRESENSI BERHASIL*\n\n📚 Matkul: *${matkul}*\n🔑 Kode Absen: \`${kode}\``);
              }
            } else {
              console.error(`[Umum] NPM ${npm} presensi ditolak: ${shot.message}`);
              if (waSenderCallback) {
                await waSenderCallback(jid, `⚠️ *AUTO PRESENSI DITOLAK*\n\n📚 Matkul: *${matkul}*\n💬 Response: _${shot.message}_`);
              }
            }
          }
        }

        // Jeda 3 detik antar pengguna agar server kampus tidak overload
        await sleep(3000);
      }

      // Random delay 2-3 menit sebelum pengecekan batch berikutnya
      const batchDelay = Math.floor(Math.random() * (180 - 120 + 1) + 120) * 1000;
      await sleep(batchDelay);

    } catch (e) {
      console.error("⚠️ Error di Loop Presensi Publik (v6):", e);
      await sleep(30000);
    }
  }
}

// Helper sleep
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
