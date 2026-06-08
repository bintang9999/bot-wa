import { useState, useEffect } from 'react';
import { BarChart3, Trash2, Edit2, Plus, X } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  type: 'pemasukan' | 'pengeluaran';
  color: string;
  totalTransactions: number;
  totalAmount: number;
}

export default function Kategori() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'pengeluaran',
    color: '#3b82f6'
  });

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/finance/categories');
      const data = await res.json();
      if (Array.isArray(data)) setCategories(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/finance/category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ name: '', type: 'pengeluaran', color: '#3b82f6' });
        fetchCategories();
      } else {
        alert("Gagal menambahkan kategori");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus kategori ini?")) return;
    try {
      const res = await fetch(`/api/finance/category/${id}`, { method: 'DELETE' });
      if (res.ok) fetchCategories();
      else alert("Gagal menghapus kategori");
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan");
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="animate-fade-in pb-12">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">Kategori</h1>
        <p className="text-sm font-medium text-zinc-400">Kelola kategori pengeluaran dan pemasukan</p>
      </div>

      {/* Add Category Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 px-6 py-3 mb-8 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] font-bold cursor-pointer"
      >
        <Plus size={20} />
        <span className="text-sm">Tambah Kategori</span>
      </button>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {categories.map((cat) => (
          <div key={cat.id} className="glass-premium rounded-3xl p-6 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-[0_0_15px_currentColor]"
                  style={{
                    backgroundColor: cat.color + '20',
                    border: `2px solid ${cat.color}40`,
                    color: cat.color,
                  }}
                >
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{cat.name}</h3>
                  <p className="text-xs text-zinc-500">{cat.type === 'pemasukan' ? '✓ Pemasukan' : '✗ Pengeluaran'}</p>
                </div>
              </div>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white">
                <Edit2 size={16} />
              </button>
            </div>

            <div className="space-y-3 mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-zinc-400">Total Transaksi</span>
                <span className="text-sm font-bold text-white">{cat.totalTransactions}x</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-zinc-400">Total Jumlah</span>
                <span className="text-sm font-bold text-white">{formatCurrency(cat.totalAmount)}</span>
              </div>
            </div>

            <button 
              onClick={() => handleDelete(cat.id)}
              className="w-full py-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs font-bold border border-red-500/20 cursor-pointer"
            >
              <Trash2 size={14} />
              Hapus
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#12121a] border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Tambah Kategori</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddCategory} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Nama Kategori</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                  placeholder="Contoh: Belanja Bulanan"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Jenis Transaksi</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setFormData({...formData, type: 'pengeluaran'})} className={`py-3 rounded-xl text-sm font-bold transition-all border ${formData.type === 'pengeluaran' ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10'}`}>
                    Pengeluaran
                  </button>
                  <button type="button" onClick={() => setFormData({...formData, type: 'pemasukan'})} className={`py-3 rounded-xl text-sm font-bold transition-all border ${formData.type === 'pemasukan' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-white/5 border-transparent text-zinc-400 hover:bg-white/10'}`}>
                    Pemasukan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">Warna Kategori</label>
                <input 
                  type="color" 
                  value={formData.color}
                  onChange={e => setFormData({...formData, color: e.target.value})}
                  className="w-full h-12 bg-white/5 border border-white/10 rounded-xl p-1 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)]">
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
