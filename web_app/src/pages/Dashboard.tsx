import { useState, useEffect } from 'react';
import { Activity, ShieldCheck, ShieldAlert, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
}

interface Transaction {
  id: string | number;
  type: 'pemasukan' | 'pengeluaran';
  amount: number;
  category: string;
  description?: string;
  date: string;
}

interface PresensiOwner {
  is_monitoring: boolean;
  sudah_absen: any[];
}

interface PresensiStatus {
  owner: PresensiOwner;
  publicUsers: Record<string, any>;
}

export default function Dashboard() {
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [presensi, setPresensi] = useState<PresensiStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      const [financeRes, txRes, presensiRes] = await Promise.all([
        fetch('/api/finance/summary?period=bulan').then(res => res.json()).catch(() => null),
        fetch('/api/finance/transactions?limit=5').then(res => res.json()).catch(() => []),
        fetch('/api/presensi/status').then(res => res.json()).catch(() => null)
      ]);
      
      if (financeRes) setFinanceSummary(financeRes);
      if (txRes) setRecentTransactions(txRes);
      if (presensiRes) setPresensi(presensiRes);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading && !financeSummary) {
    return <div className="p-8 text-center text-secondary animate-pulse">Initializing Dashboard...</div>;
  }

  const formatCurrency = (val?: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  return (
    <div className="animate-fade-in pb-12">
      
      {/* Finance Overview */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold text-white mb-0">Finance (Bulan Ini)</h2>
        <Link to="/finance" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Lihat Detail</Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className="glass-premium rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Pemasukan</span>
          <span className="text-3xl font-bold text-emerald-500">{formatCurrency(financeSummary?.income || 0)}</span>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>
        <div className="glass-premium rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Pengeluaran</span>
          <span className="text-3xl font-bold text-red-500">{formatCurrency(financeSummary?.expense || 0)}</span>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>
        <div className="glass-premium rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Sisa Saldo</span>
          <span className="text-3xl font-bold text-blue-500">{formatCurrency(financeSummary?.balance || 0)}</span>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Transactions Widget */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-0">
            <h2 className="text-lg font-bold text-white mb-0">Transaksi Terakhir</h2>
          </div>
          <div className="glass-premium rounded-3xl p-8 flex-1">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-zinc-500 text-sm">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center p-3.5 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/10 group">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-[0_0_15px_currentColor] border ${tx.type === 'pemasukan' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white mb-1 capitalize group-hover:text-indigo-200 transition-colors">{tx.category}</div>
                        <div className="text-[11px] font-medium text-zinc-500">{new Date(tx.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</div>
                      </div>
                    </div>
                    <div className={`text-base font-bold ${tx.type === 'pemasukan' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.type === 'pemasukan' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Link to="/Riwayat" className="mt-6 flex justify-center w-full py-3.5 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/40 hover:to-purple-500/40 text-indigo-300 hover:text-white border border-indigo-500/30 text-sm font-bold rounded-2xl transition-all">
              Lihat Semua Transaksi
            </Link>
          </div>
        </div>

        {/* Presensi Status */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center mb-0">
            <h2 className="text-lg font-bold text-white mb-0 flex items-center gap-2">
              <Activity size={20} className="text-indigo-500" /> 
              Status Presensi
            </h2>
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              Live
            </span>
          </div>
          
          <div className="flex flex-col gap-5">
            {/* Owner Status */}
            <div className="glass-premium rounded-3xl p-6">
              <h3 className="flex items-center gap-3 mb-5 text-sm font-bold text-zinc-300">
                {presensi?.owner?.is_monitoring ? (
                  <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500 border border-emerald-500/20"><ShieldCheck size={18} /></div>
                ) : (
                  <div className="p-2 bg-zinc-500/10 rounded-lg text-zinc-400 border border-zinc-500/20"><ShieldAlert size={18} /></div>
                )}
                Sistem Pribadi (Owner)
              </h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-zinc-400 text-xs font-medium">Status Pemantauan</span>
                  {presensi?.owner?.is_monitoring ? (
                    <span className="text-xs font-bold text-emerald-500">Aktif</span>
                  ) : (
                    <span className="text-xs font-bold text-zinc-500">Nonaktif</span>
                  )}
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                  <span className="text-zinc-400 text-xs font-medium">Kelas Dihadiri</span>
                  <span className="font-bold text-white">{presensi?.owner?.sudah_absen?.length || 0} Kelas</span>
                </div>
              </div>
            </div>

            {/* Public Users Status */}
            <div className="glass-premium rounded-3xl p-6">
              <h3 className="flex items-center gap-3 mb-5 text-sm font-bold text-zinc-300">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500 border border-purple-500/20"><ShieldCheck size={18} /></div>
                Publik (Multi-User)
              </h3>
              
              <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                <span className="text-zinc-400 text-xs font-medium">Pengguna Aktif</span>
                <span className="font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]"></span>
                  {Object.keys(presensi?.publicUsers || {}).length} User
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
