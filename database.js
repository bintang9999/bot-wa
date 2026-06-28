import fs from 'fs';
import path from 'path';

const DB_DIR = path.resolve('data');
const DB_PATH = path.join(DB_DIR, 'db.json');

// Pastikan direktori database dan filenya ada
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ transactions: [], ewallets: [], categories: [], goals: [], cicilans: [], tasks: [] }, null, 2));
}

// Fungsi untuk membaca database
function readDB() {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.ewallets) parsed.ewallets = [];
    if (!parsed.categories) parsed.categories = [];
    if (!parsed.goals) parsed.goals = [];
    if (!parsed.cicilans) parsed.cicilans = [];
    if (!parsed.tasks) parsed.tasks = [];
    return parsed;
  } catch (error) {
    console.error('Gagal membaca database, membuat data kosong:', error);
    return { transactions: [], ewallets: [], categories: [], goals: [], cicilans: [], tasks: [] };
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

// Mendapatkan daftar E-Wallet
export function getEWallets() {
  const db = readDB();
  return db.ewallets || [];
}

// Menambah E-Wallet baru
export function addEWallet(name, balance, color) {
  const db = readDB();
  if (!db.ewallets) db.ewallets = [];
  const newWallet = {
    id: `ew-${Date.now()}`,
    name,
    balance: parseFloat(balance),
    color: color || '#3b82f6'
  };
  db.ewallets.push(newWallet);
  writeDB(db);
  return newWallet;
}

// Menghapus E-Wallet
export function deleteEWallet(id) {
  const db = readDB();
  if (!db.ewallets) return false;
  const initialLength = db.ewallets.length;
  db.ewallets = db.ewallets.filter(ew => ew.id !== id);
  if (db.ewallets.length < initialLength) {
    writeDB(db);
    return true;
  }
  return false;
}

// Mendapatkan daftar Kategori beserta statistiknya
export function getCategories() {
  const db = readDB();
  let cats = db.categories || [];
  
  const stats = {};
  db.transactions.forEach(tx => {
    const key = tx.category.toLowerCase().trim();
    if (!stats[key]) stats[key] = { count: 0, amount: 0, type: tx.type };
    stats[key].count++;
    stats[key].amount += tx.amount;
  });

  const existingNames = new Set(cats.map(c => c.name.toLowerCase().trim()));
  let modified = false;

  const defaultColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];
  let colorIdx = cats.length;

  for (const [catName, data] of Object.entries(stats)) {
    if (!existingNames.has(catName)) {
      cats.push({
        id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: catName.charAt(0).toUpperCase() + catName.slice(1),
        type: data.type,
        color: defaultColors[colorIdx++ % defaultColors.length]
      });
      existingNames.add(catName);
      modified = true;
    }
  }

  if (modified) {
    db.categories = cats;
    writeDB(db);
  }

  return cats.map(cat => ({
    ...cat,
    totalTransactions: stats[cat.name.toLowerCase().trim()]?.count || 0,
    totalAmount: stats[cat.name.toLowerCase().trim()]?.amount || 0
  }));
}

// Menambah Kategori baru
export function addCategory(name, type, color) {
  const db = readDB();
  if (!db.categories) db.categories = [];
  const newCat = {
    id: `cat-${Date.now()}`,
    name,
    type,
    color: color || '#3b82f6'
  };
  db.categories.push(newCat);
  writeDB(db);
  return newCat;
}

// Menghapus Kategori
export function deleteCategory(id) {
  const db = readDB();
  if (!db.categories) return false;
  const initialLength = db.categories.length;
  db.categories = db.categories.filter(c => c.id !== id);
  if (db.categories.length < initialLength) {
    writeDB(db);
    return true;
  }
  return false;
}

// Mendapatkan tren pemasukan dan pengeluaran 6 bulan terakhir
export function getSixMonthsTrend() {
  const db = readDB();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const trend = [];
  
  const now = new Date();
  
  // Membuat wadah untuk 6 bulan terakhir secara kronologis
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    trend.push({
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      name: months[d.getMonth()],
      pemasukan: 0,
      pengeluaran: 0
    });
  }

  // Agregasi transaksi ke dalam bulan yang sesuai
  db.transactions.forEach(tx => {
    const txDate = new Date(tx.date);
    const txYear = txDate.getFullYear();
    const txMonth = txDate.getMonth();
    
    const bucket = trend.find(b => b.year === txYear && b.monthIndex === txMonth);
    if (bucket) {
      if (tx.type === 'pemasukan') bucket.pemasukan += tx.amount;
      if (tx.type === 'pengeluaran') bucket.pengeluaran += tx.amount;
    }
  });

  // Hapus properti internal dan kembalikan format yang siap pakai untuk Recharts
  return trend.map(b => ({
    name: b.name,
    pemasukan: b.pemasukan,
    pengeluaran: b.pengeluaran
  }));
}

// Mendapatkan daftar Tujuan
export function getGoals() {
  const db = readDB();
  const now = new Date();
  
  return (db.goals || []).map(goal => {
    let status = goal.status;
    const isCompleted = goal.currentAmount >= goal.targetAmount;
    if (isCompleted) {
      status = 'completed';
    } else {
      const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (daysLeft < 14) status = 'at_risk';
      else status = 'on_track';
    }
    return { ...goal, status };
  });
}

// Menambah Tujuan Baru
export function addGoal(name, targetAmount, deadline, category, color) {
  const db = readDB();
  if (!db.goals) db.goals = [];
  const newGoal = {
    id: `goal-${Date.now()}`,
    name,
    targetAmount: parseFloat(targetAmount),
    currentAmount: 0,
    deadline,
    category: category || 'Umum',
    color: color || '#3b82f6',
    status: 'on_track'
  };
  db.goals.push(newGoal);
  writeDB(db);
  return newGoal;
}

// Menambah dana ke Tujuan
export function fundGoal(id, amount) {
  const db = readDB();
  if (!db.goals) return null;
  const goalIndex = db.goals.findIndex(g => g.id === id);
  if (goalIndex === -1) return null;
  
  const parsedAmount = parseFloat(amount);
  db.goals[goalIndex].currentAmount += parsedAmount;
  
  if (db.goals[goalIndex].currentAmount >= db.goals[goalIndex].targetAmount) {
    db.goals[goalIndex].currentAmount = db.goals[goalIndex].targetAmount;
    db.goals[goalIndex].status = 'completed';
  }
  
  writeDB(db);
  return db.goals[goalIndex];
}

// Menghapus Tujuan
export function deleteGoal(id) {
  const db = readDB();
  if (!db.goals) return false;
  const initLen = db.goals.length;
  db.goals = db.goals.filter(g => g.id !== id);
  if (db.goals.length < initLen) {
    writeDB(db);
    return true;
  }
  return false;
}

// Mendapatkan daftar Cicilan/Hutang
export function getCicilans() {
  const db = readDB();
  return db.cicilans || [];
}

// Menambah Cicilan/Hutang
export function addCicilan(name, totalAmount, dueDate) {
  const db = readDB();
  if (!db.cicilans) db.cicilans = [];
  const newCicilan = {
    id: `cicilan-${Date.now()}`,
    name,
    totalAmount: parseFloat(totalAmount),
    collected: 0,
    dueDate: dueDate || 28,
    status: 'active'
  };
  db.cicilans.push(newCicilan);
  writeDB(db);
  return newCicilan;
}

// Setor Uang ke Cicilan/Hutang
export function setorCicilan(id, amount) {
  const db = readDB();
  if (!db.cicilans) return null;
  const idx = db.cicilans.findIndex(c => c.id === id);
  if (idx === -1) return null;
  
  db.cicilans[idx].collected += parseFloat(amount);
  if (db.cicilans[idx].collected >= db.cicilans[idx].totalAmount) {
    db.cicilans[idx].status = 'completed';
  }
  
  writeDB(db);
  return db.cicilans[idx];
}

// Menghapus Cicilan
export function deleteCicilan(id) {
  const db = readDB();
  if (!db.cicilans) return false;
  const initLen = db.cicilans.length;
  db.cicilans = db.cicilans.filter(c => c.id !== id);
  if (db.cicilans.length < initLen) {
    writeDB(db);
    return true;
  }
  return false;
}

// =============================================
// TASK MANAGEMENT (Tugas)
// =============================================

// Mendapatkan daftar Tugas
export function getTasks() {
  const db = readDB();
  return (db.tasks || []).sort((a, b) => {
    // Urutkan: belum selesai dulu, lalu berdasarkan prioritas (high > medium > low), lalu tanggal terbaru
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(b.createdAt) - new Date(a.createdAt);
  });
}

// Menambah Tugas Baru
export function addTask(title, description, priority, dueDate, category) {
  const db = readDB();
  if (!db.tasks) db.tasks = [];
  const newTask = {
    id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title,
    description: description || '',
    priority: priority || 'medium',
    dueDate: dueDate || null,
    category: category || 'Umum',
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  db.tasks.push(newTask);
  writeDB(db);
  return newTask;
}

// Mengupdate Tugas
export function updateTask(id, updates) {
  const db = readDB();
  if (!db.tasks) return null;
  const idx = db.tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;

  const allowed = ['title', 'description', 'priority', 'dueDate', 'category'];
  for (const key of allowed) {
    if (updates[key] !== undefined) {
      db.tasks[idx][key] = updates[key];
    }
  }

  writeDB(db);
  return db.tasks[idx];
}

// Toggle status selesai Tugas
export function toggleTask(id) {
  const db = readDB();
  if (!db.tasks) return null;
  const idx = db.tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;

  db.tasks[idx].completed = !db.tasks[idx].completed;
  db.tasks[idx].completedAt = db.tasks[idx].completed ? new Date().toISOString() : null;

  writeDB(db);
  return db.tasks[idx];
}

// Menghapus Tugas
export function deleteTask(id) {
  const db = readDB();
  if (!db.tasks) return false;
  const initLen = db.tasks.length;
  db.tasks = db.tasks.filter(t => t.id !== id);
  if (db.tasks.length < initLen) {
    writeDB(db);
    return true;
  }
  return false;
}
