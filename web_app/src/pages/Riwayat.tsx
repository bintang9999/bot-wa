import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Calendar, Download, Filter, Plus } from 'lucide-react';
import TransactionModal from '../components/Finance/TransactionModal';
import SwipeableTransaction from '../components/Finance/SwipeableTransaction';

interface HistoryEntry {
  id: string;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  description: string;
  date: string;
  status: 'completed' | 'pending' | 'failed';
}

export default function Riwayat() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/finance/transactions');
      const data = await res.json();
      if (Array.isArray(data)) {
        const mappedData = data.map((tx: any) => ({
          ...tx,
          status: 'completed'
        }));
        setHistory(mappedData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDeleteTransaction = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        const res = await fetch(`/api/finance/transaction/${id}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          fetchHistory();
        } else {
          toast.error('Gagal menghapus transaksi');
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const [visibleCount, setVisibleCount] = useState(10);

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
    try {
      const res = await fetch('/api/finance/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
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
        fetchHistory();
      } else {
        toast.error('Gagal menambahkan transaksi');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch('/api/finance/export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transaksi-keuangan.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error('Gagal mengekspor data');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan');
    }
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'failed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="animate-fade-in pb-12">

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 flex gap-3">
          <button className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all">
            <Calendar size={18} />
            <span className="text-sm font-bold">Bulan Ini</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all">
            <Filter size={18} />
            <span className="text-sm font-bold">Filter</span>
          </button>
        </div>
         <div className="flex gap-3">
           <button onClick={handleExport} className="flex items-center gap-2 px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl transition-all font-bold cursor-pointer">
             <Download size={18} />
             <span className="text-sm hidden sm:inline">Export</span>
           </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-bold text-white shadow-lg hover:opacity-90 cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
          >
            <Plus size={18} />
            <span className="text-sm">Tambah</span>
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="glass-premium rounded-3xl p-8">
        <div className="space-y-4">
          {history.slice(0, visibleCount).map((entry, index) => (
            <div key={entry.id} className="flex gap-6">
              {/* Timeline dot and line */}
              <div className="flex flex-col items-center">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  entry.status === 'completed'
                    ? 'bg-emerald-500 border-emerald-600'
                    : entry.status === 'pending'
                    ? 'bg-yellow-500 border-yellow-600'
                    : 'bg-red-500 border-red-600'
                }`} />
                {index < history.length - 1 && (
                  <div className="w-0.5 h-24 bg-gradient-to-b from-white/20 to-transparent mt-2" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 pb-6 overflow-hidden">
                <SwipeableTransaction onDelete={() => handleDeleteTransaction(entry.id)}>
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-base font-bold text-white">{entry.description}</h3>
                        <p className="text-xs text-zinc-500">{new Date(entry.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(entry.status)}`}>
                        {entry.status === 'completed' ? 'Selesai' : entry.status === 'pending' ? 'Pending' : 'Gagal'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                        entry.type === 'pemasukan'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-red-500/10 text-red-400'
                      }`}>
                        {entry.category}
                      </div>
                      <span className={`text-sm font-bold ${
                        entry.type === 'pemasukan' ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {entry.type === 'pemasukan' ? '+' : '-'}{formatCurrency(entry.amount)}
                      </span>
                    </div>
                  </div>
                </SwipeableTransaction>
              </div>
            </div>
          ))}
        </div>
        
        {visibleCount < history.length && (
          <div className="mt-8 flex justify-center">
            <button 
              onClick={() => setVisibleCount(prev => prev + 10)}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold text-zinc-300 transition-colors cursor-pointer"
            >
              Muat Lebih Banyak ({history.length - visibleCount} lagi)
            </button>
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
