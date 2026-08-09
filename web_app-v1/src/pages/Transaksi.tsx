import { useState, useEffect } from 'react';
import { Search, Plus, Filter, ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import TransactionModal from '../components/Finance/TransactionModal';

interface Transaction {
  id: string;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  description: string;
  date: string;
  account?: string;
}

export default function Transaksi() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('/api/finance/transactions');
      const data = await res.json();
      if (Array.isArray(data)) {
        setTransactions(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'pengeluaran',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, amount: formData.amount.replace(/\./g, '') };
    try {
      const res = await fetch('/api/finance/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ 
          type: 'pengeluaran', 
          amount: '', 
          category: '', 
          description: '',
          date: new Date().toISOString().split('T')[0]
        });
        fetchTransactions();
        toast.success('Transaksi berhasil ditambahkan');
      } else {
        toast.error("Gagal menambahkan transaksi");
      }
    } catch (err) {
      console.error(err);
      toast.error("Terjadi kesalahan");
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pemasukan' | 'pengeluaran'>('all');

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         tx.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    try {
      const res = await fetch(`/api/finance/transaction/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTransactions();
        toast.success('Transaksi berhasil dihapus');
      } else {
        toast.error('Gagal menghapus transaksi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan');
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="animate-fade-in pb-12">

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Cari transaksi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all">
            <Filter size={18} />
            <span className="text-sm font-bold">Filter</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] font-bold cursor-pointer"
          >
            <Plus size={18} />
            <span className="text-sm">Tambah</span>
          </button>
        </div>
      </div>

      {/* Filter Pills */}
      <div className="flex gap-2 mb-8">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            filterType === 'all'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50'
              : 'bg-white/5 text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => setFilterType('pemasukan')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            filterType === 'pemasukan'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              : 'bg-white/5 text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white'
          }`}
        >
          Pemasukan
        </button>
        <button
          onClick={() => setFilterType('pengeluaran')}
          className={`px-4 py-2 rounded-full text-sm font-bold transition-all ${
            filterType === 'pengeluaran'
              ? 'bg-red-500/20 text-red-300 border border-red-500/50'
              : 'bg-white/5 text-zinc-400 border border-white/10 hover:border-white/20 hover:text-white'
          }`}
        >
          Pengeluaran
        </button>
      </div>

      {/* Transaction List */}
      <div className="glass-premium rounded-3xl p-6">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Tanggal</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Deskripsi</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-zinc-400 uppercase tracking-wider">Akun</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">Jumlah</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-zinc-400 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer group">
                  <td className="px-6 py-4 text-sm text-zinc-300">{new Date(tx.date).toLocaleDateString('id-ID')}</td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-white px-3 py-1 bg-white/5 rounded-lg inline-block group-hover:bg-white/10 transition-colors">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{tx.description}</td>
                  <td className="px-6 py-4 text-sm text-zinc-400">{tx.account || '-'}</td>
                  <td className={`px-6 py-4 text-right text-sm font-bold ${
                    tx.type === 'pemasukan' ? 'text-emerald-500' : 'text-red-500'
                  }`}>
                    <span className="flex items-center justify-end gap-2">
                      {tx.type === 'pemasukan' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                      {formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(tx.id); }}
                      className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="flex flex-col gap-4 md:hidden">
          {filteredTransactions.map((tx) => (
            <div key={tx.id} className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3 relative">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm font-bold text-white px-3 py-1 bg-white/10 rounded-lg inline-block mb-2">
                    {tx.category}
                  </span>
                  <p className="text-sm text-zinc-300 font-medium">{tx.description}</p>
                </div>
                <button 
                  onClick={() => handleDelete(tx.id)}
                  className="p-2 bg-black/20 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              <div className="flex justify-between items-end mt-1 pt-3 border-t border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs text-zinc-500">{new Date(tx.date).toLocaleDateString('id-ID')}</span>
                  <span className="text-xs text-zinc-500">{tx.account || 'Umum'}</span>
                </div>
                <div className={`text-sm font-bold flex items-center gap-1 ${
                  tx.type === 'pemasukan' ? 'text-emerald-500' : 'text-red-500'
                }`}>
                  {tx.type === 'pemasukan' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  {formatCurrency(tx.amount)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">Tidak ada transaksi yang sesuai</p>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {isModalOpen && (
        <TransactionModal 
          formData={formData}
          setFormData={setFormData}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddTransaction}
        />
      )}
    </div>
  );
}
