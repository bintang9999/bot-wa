import fs from 'fs';
import path from 'path';

const DB_DIR = path.resolve('data');
const DB_PATH = path.join(DB_DIR, 'db.json');

// Pastikan direktori database dan filenya ada
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ transactions: [] }, null, 2));
}

// Fungsi untuk membaca database
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Gagal membaca database, membuat data kosong:', error);
    return { transactions: [] };
  }
}

// Fungsi untuk menyimpan ke database
function writeDB(data) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Gagal menyimpan ke database:', error);
  }
}

// Format mata uang Rupiah
export function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

// Menambah transaksi baru
export function addTransaction(type, amount, category, description) {
  const db = readDB();
  const newTransaction = {
    id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type, // 'pemasukan' atau 'pengeluaran'
    amount: parseFloat(amount),
    category: category.toLowerCase().trim(),
    description: description.trim(),
    date: new Date().toISOString()
  };
  db.transactions.push(newTransaction);
  writeDB(db);
  return newTransaction;
}

// Mengambil seluruh transaksi
export function getTransactions(limit = null) {
  const db = readDB();
  // Urutkan berdasarkan tanggal terbaru dahulu (descending)
  const sorted = [...db.transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  return limit ? sorted.slice(0, limit) : sorted;
}

// Menghapus transaksi berdasarkan ID
export function deleteTransaction(id) {
  const db = readDB();
  const initialLength = db.transactions.length;
  db.transactions = db.transactions.filter(tx => tx.id !== id);
  if (db.transactions.length < initialLength) {
    writeDB(db);
    return true;
  }
  return false;
}

// Mendapatkan saldo saat ini
export function getBalance() {
  const db = readDB();
  let income = 0;
  let expense = 0;
  db.transactions.forEach(tx => {
    if (tx.type === 'pemasukan') income += tx.amount;
    if (tx.type === 'pengeluaran') expense += tx.amount;
  });
  return { income, expense, balance: income - expense };
}

// Mendapatkan rekap/ringkasan periode tertentu
export function getSummary(period = 'bulan') {
  const db = readDB();
  const now = new Date();
  let filterFn;

  if (period === 'hari') {
    filterFn = (tx) => {
      const txDate = new Date(tx.date);
      return txDate.toDateString() === now.toDateString();
    };
  } else if (period === 'minggu') {
    filterFn = (tx) => {
      const txDate = new Date(tx.date);
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return txDate >= oneWeekAgo && txDate <= now;
    };
  } else {
    // default: bulan ini
    filterFn = (tx) => {
      const txDate = new Date(tx.date);
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    };
  }

  const filtered = db.transactions.filter(filterFn);
  let income = 0;
  let expense = 0;
  const categories = {};

  filtered.forEach(tx => {
    if (tx.type === 'pemasukan') income += tx.amount;
    if (tx.type === 'pengeluaran') {
      expense += tx.amount;
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
    }
  });

  return {
    period,
    income,
    expense,
    balance: income - expense,
    categories,
    count: filtered.length
  };
}

// Membuat data ekspor berformat CSV
export function getExportCSV() {
  const db = readDB();
  if (db.transactions.length === 0) return null;
  
  // Header CSV dengan BOM agar dibaca UTF-8 dengan benar oleh Excel
  let csv = '\uFEFFID,Tanggal,Tipe,Kategori,Nominal,Keterangan\n';
  
  // Urutkan berdasarkan tanggal terlama dahulu (ascending)
  const sorted = [...db.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  sorted.forEach(tx => {
    const localDate = new Date(tx.date).toLocaleString('id-ID');
    const cleanDesc = tx.description.replace(/"/g, '""');
    const cleanCategory = tx.category.replace(/"/g, '""');
    csv += `"${tx.id}","${localDate}","${tx.type}","${cleanCategory}",${tx.amount},"${cleanDesc}"\n`;
  });
  
  return csv;
}
