import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Transaction {
  id: string | number;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  description?: string;
  date: string;
  account?: string;
}

import SwipeableTransaction from './SwipeableTransaction';

interface RecentTransactionsProps {
  transactions: Transaction[];
  onRefresh?: () => void;
}

export default function RecentTransactions({ transactions, onRefresh }: RecentTransactionsProps) {
  const navigate = useNavigate();
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const handleDelete = async (id: string | number) => {
    if (confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        const res = await fetch(`/api/finance/transaction/${id}`, { method: 'DELETE' });
        if (res.ok && onRefresh) {
          onRefresh();
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  // We are currently using mock UI data for recent transactions, 
  // but if real transactions are provided, we map over them.
  const hasTransactions = transactions.length > 0;

  return (
    <div className="glass-premium rounded-3xl p-8 flex flex-col h-full">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-bold text-white mb-0">Transaksi Terbaru</h2>
        <button onClick={() => navigate('/riwayat')} className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer">Lihat Semua</button>
      </div>

      <div className="flex flex-col gap-4 flex-1">
        {hasTransactions ? (
           transactions.slice(0, 5).map(tx => (
            <SwipeableTransaction key={tx.id} onDelete={() => handleDelete(tx.id)}>
              <div className="flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_0_15px_currentColor] border ${tx.type === 'pemasukan' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    {tx.type === 'pemasukan' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white mb-1 capitalize group-hover:text-indigo-200 transition-colors">{tx.category}</div>
                    <div className="text-[11px] font-medium text-zinc-500">
                      {new Date(tx.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} • {new Date(tx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
                <div className={`text-base font-bold ${tx.type === 'pemasukan' ? 'text-emerald-500' : 'text-red-500'}`}>
                  {tx.type === 'pemasukan' ? '+' : '-'}{formatCurrency(tx.amount)}
                </div>
              </div>
            </SwipeableTransaction>
           ))
        ) : (
          <div className="text-center py-12">
            <p className="text-zinc-500 text-sm">Belum ada transaksi terbaru</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => navigate('/riwayat')}
        className="w-full py-3.5 mt-6 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/40 hover:to-purple-500/40 text-indigo-300 hover:text-white border border-indigo-500/30 text-sm font-bold rounded-2xl transition-all cursor-pointer"
      >
        Lihat Semua Transaksi
      </button>
    </div>
  );
}
