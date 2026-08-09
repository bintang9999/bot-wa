import { useState, useEffect } from 'react';
import { Activity, ShieldCheck, ShieldAlert, Calendar, TrendingUp, TrendingDown, Wallet, BarChart3, Flame, ArrowUpRight, Users } from 'lucide-react';
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

interface WeeklyReport {
  period: { from: string; to: string };
  totalTransactions: number;
  income: number;
  expense: number;
  balance: number;
  topCategory: { name: string; amount: number };
  dailyAverage: number;
  dailyData: { name: string; pemasukan: number; pengeluaran: number }[];
}


export default function Dashboard() {
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [presensi, setPresensi] = useState<PresensiStatus | null>(null);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      const [financeRes, txRes, presensiRes, weeklyRes] = await Promise.all([
        fetch('/api/finance/summary?period=bulan').then(res => res.json()).catch(() => null),
        fetch('/api/finance/transactions?limit=10').then(res => res.json()).catch(() => []),
        fetch('/api/presensi/status').then(res => res.json()).catch(() => null),
        fetch('/api/finance/weekly-report').then(res => res.json()).catch(() => null)
      ]);
      
      if (financeRes) setFinanceSummary(financeRes);
      if (txRes) setRecentTransactions(txRes);
      if (presensiRes) setPresensi(presensiRes);
      if (weeklyRes) setWeeklyReport(weeklyRes);
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
  const formatCompact = (val?: number) => {
    if (!val) return 'Rp0';
    if (val >= 1000000) return `Rp${(val / 1000000).toFixed(1)}jt`;
    if (val >= 1000) return `Rp${(val / 1000).toFixed(0)}k`;
    return `Rp${val}`;
  };


  return (
    <div className="animate-fade-in dashboard-full-height">

      {/* Row 1: Section Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Keuangan Bulan Ini</h2>
        <Link to="/finance" className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1">
          Detail <ArrowUpRight size={12} />
        </Link>
      </div>
      
      {/* Row 2: Finance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 stagger-fade-in">
        {/* Pemasukan */}
        <div className="glass-premium card-glow rounded-2xl p-4 md:p-5 relative overflow-hidden group flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider">Pemasukan</span>
            <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
          </div>
          <span className="text-xl md:text-2xl font-extrabold gradient-text-emerald">{formatCurrency(financeSummary?.income || 0)}</span>
          {/* Sparkline */}
          <div className="absolute bottom-0 left-0 w-full h-8 opacity-60 pointer-events-none">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,18 C15,22 25,5 45,12 C65,19 80,8 100,10 L100,25 L0,25 Z" fill="url(#gradGreenDash)" opacity="0.2"/>
              <path d="M0,18 C15,22 25,5 45,12 C65,19 80,8 100,10" fill="none" stroke="#10b981" strokeWidth="1.5" opacity="0.6"/>
              <defs>
                <linearGradient id="gradGreenDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Pengeluaran */}
        <div className="glass-premium card-glow rounded-2xl p-4 md:p-5 relative overflow-hidden group flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider">Pengeluaran</span>
            <div className="p-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
              <TrendingDown size={14} className="text-red-500" />
            </div>
          </div>
          <span className="text-xl md:text-2xl font-extrabold text-red-500">{formatCurrency(financeSummary?.expense || 0)}</span>
          <div className="absolute bottom-0 left-0 w-full h-8 opacity-60 pointer-events-none">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,12 C20,8 30,20 50,16 C70,12 85,20 100,18 L100,25 L0,25 Z" fill="url(#gradRedDash)" opacity="0.2"/>
              <path d="M0,12 C20,8 30,20 50,16 C70,12 85,20 100,18" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6"/>
              <defs>
                <linearGradient id="gradRedDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Sisa Saldo */}
        <div className="glass-premium card-glow rounded-2xl p-4 md:p-5 relative overflow-hidden group flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-wider">Sisa Saldo</span>
            <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Wallet size={14} className="text-indigo-400" />
            </div>
          </div>
          <span className="text-xl md:text-2xl font-extrabold gradient-text">{formatCurrency(financeSummary?.balance || 0)}</span>
          <div className="absolute bottom-0 left-0 w-full h-8 opacity-60 pointer-events-none">
            <svg viewBox="0 0 100 25" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,20 C10,8 20,12 35,16 C55,20 70,6 100,12 L100,25 L0,25 Z" fill="url(#gradBlueDash)" opacity="0.2"/>
              <path d="M0,20 C10,8 20,12 35,16 C55,20 70,6 100,12" fill="none" stroke="#6366f1" strokeWidth="1.5" opacity="0.6"/>
              <defs>
                <linearGradient id="gradBlueDash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="1" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Weekly Report + Mini Chart */}
      {(() => {
        const report = weeklyReport || {
          totalTransactions: 0,
          dailyAverage: 0,
          topCategory: { name: '-', amount: 0 },
          balance: 0,
          dailyData: [
            { name: 'Min', pemasukan: 0, pengeluaran: 0 },
            { name: 'Sen', pemasukan: 0, pengeluaran: 0 },
            { name: 'Sel', pemasukan: 0, pengeluaran: 0 },
            { name: 'Rab', pemasukan: 0, pengeluaran: 0 },
            { name: 'Kam', pemasukan: 0, pengeluaran: 0 },
            { name: 'Jum', pemasukan: 0, pengeluaran: 0 },
            { name: 'Sab', pemasukan: 0, pengeluaran: 0 }
          ]
        };
        const chartDailyData = report.dailyData || [];
        const chartMaxVal = Math.max(...chartDailyData.map(d => Math.max(d.pemasukan, d.pengeluaran)), 1);

        return (
          <div className="flex flex-col min-h-0 h-full">
            <div className="mb-2 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 size={14} className="text-indigo-400" />
                Ringkasan Minggu Ini
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5 md:gap-3 stagger-fade-in flex-1 min-h-0">
              {/* Quick Stats Row */}
              <div className="md:col-span-2 grid grid-cols-2 gap-2.5">
                <div className="glass-premium rounded-xl p-3 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Transaksi</span>
                  <span className="text-xl font-extrabold text-white">{report.totalTransactions}</span>
                  <span className="text-[9px] font-medium text-zinc-500 mt-0.5">7 hari terakhir</span>
                </div>

                <div className="glass-premium rounded-xl p-3 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Rata²/Hari</span>
                  <span className="text-xl font-extrabold text-amber-400">{formatCompact(report.dailyAverage)}</span>
                  <span className="text-[9px] font-medium text-zinc-500 mt-0.5">pengeluaran</span>
                </div>

                <div className="glass-premium rounded-xl p-3 flex flex-col justify-center">
                  <div className="flex items-center gap-1 mb-1">
                    <Flame size={12} className="text-orange-400" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Top Kategori</span>
                  </div>
                  <span className="text-xs font-bold text-white truncate">{report.topCategory.name}</span>
                  <span className="text-[9px] font-medium text-zinc-500 mt-0.5">{formatCompact(report.topCategory.amount)}</span>
                </div>

                <div className="glass-premium rounded-xl p-3 flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Selisih</span>
                  <span className={`text-xl font-extrabold ${report.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {report.balance >= 0 ? '+' : ''}{formatCompact(report.balance)}
                  </span>
                  <span className="text-[9px] font-medium text-zinc-500 mt-0.5">minggu ini</span>
                </div>
              </div>

              {/* Mini Daily Chart */}
              <div className="md:col-span-3 glass-premium rounded-xl p-4 flex flex-col">
                <div className="flex items-center justify-between mb-2 flex-shrink-0">
                  <span className="text-xs font-bold text-zinc-400">Aktivitas Harian</span>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Masuk
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-400">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Keluar
                    </span>
                  </div>
                </div>

                <div className="flex items-end gap-1.5 flex-1">
                  {chartDailyData.map((day, i) => {
                    const inHeight = Math.max((day.pemasukan / chartMaxVal) * 100, 3);
                    const outHeight = Math.max((day.pengeluaran / chartMaxVal) * 100, 3);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex gap-0.5 items-end flex-1">
                          <div
                            className="flex-1 rounded-t-sm bg-emerald-500/70 transition-all duration-700"
                            style={{ height: `${inHeight}%`, animationDelay: `${i * 80}ms` }}
                            title={`Masuk: ${formatCompact(day.pemasukan)}`}
                          />
                          <div
                            className="flex-1 rounded-t-sm bg-red-500/70 transition-all duration-700"
                            style={{ height: `${outHeight}%`, animationDelay: `${i * 80}ms` }}
                            title={`Keluar: ${formatCompact(day.pengeluaran)}`}
                          />
                        </div>
                        <span className="text-[9px] font-bold text-zinc-600">{day.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Row 4: Transaksi Terakhir & Status Presensi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0 overflow-hidden">
        {/* Recent Transactions Widget */}
        <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
          <div className="flex justify-between items-center flex-shrink-0">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={14} className="text-indigo-400" />
              Transaksi Terakhir
            </h2>
          </div>
          <div className="glass-premium rounded-2xl p-4 flex flex-col flex-1 min-h-0 overflow-hidden">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8 my-auto">
                <p className="text-zinc-500 text-sm">Belum ada transaksi</p>
              </div>
            ) : (
              <div className="flex flex-col gap-1 overflow-y-auto flex-1 min-h-0 pr-1">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex justify-between items-center p-2.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-transparent hover:border-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${tx.type === 'pemasukan' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                        {tx.type === 'pemasukan' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white mb-0.5 capitalize group-hover:text-indigo-200 transition-colors">{tx.category}</div>
                        <div className="text-[10px] font-medium text-zinc-600">{new Date(tx.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</div>
                      </div>
                    </div>
                    <div className={`text-xs font-bold ${tx.type === 'pemasukan' ? 'text-emerald-500' : 'text-red-500'}`}>
                      {tx.type === 'pemasukan' ? '+' : '-'}{formatCurrency(tx.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <Link to="/riwayat" className="mt-2 flex-shrink-0 flex justify-center w-full py-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 text-indigo-400 hover:text-indigo-300 border border-indigo-500/20 text-xs font-bold rounded-xl transition-all">
              Lihat Semua Transaksi
            </Link>
          </div>
        </div>

        {/* Presensi Status */}
        <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
          <div className="flex justify-between items-center flex-shrink-0">
            <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Activity size={14} className="text-indigo-400" /> 
              Status Presensi
            </h2>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full live-pulse"></div>
              Live
            </span>
          </div>
          
          <div className="glass-premium rounded-2xl p-4 flex flex-col justify-between flex-1 min-h-0">
            {/* Owner Status */}
            <div>
              <div className="flex items-center gap-3 mb-2.5">
                {presensi?.owner?.is_monitoring ? (
                  <div className="p-1.5 bg-emerald-500/10 rounded-xl text-emerald-500 border border-emerald-500/20">
                    <ShieldCheck size={16} />
                  </div>
                ) : (
                  <div className="p-1.5 bg-zinc-500/10 rounded-xl text-zinc-400 border border-zinc-500/20">
                    <ShieldAlert size={16} />
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-bold text-white">Sistem Pribadi</h3>
                  <p className="text-[10px] font-medium text-zinc-500">Auto-presensi portal kampus</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block mb-0.5">Status</span>
                  {presensi?.owner?.is_monitoring ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full live-pulse"></span> Aktif
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-zinc-500">Nonaktif</span>
                  )}
                </div>
                <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                  <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider block mb-0.5">Kelas</span>
                  <span className="font-bold text-white text-xs">{presensi?.owner?.sudah_absen?.length || 0}</span>
                  <span className="text-[10px] text-zinc-600 ml-1">dihadiri</span>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-white/5 my-2"></div>

            {/* Public Users Status */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-1.5 bg-violet-500/10 rounded-xl text-violet-400 border border-violet-500/20">
                  <Users size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">Multi-User</h3>
                  <p className="text-[10px] font-medium text-zinc-500">Pengguna terdaftar di bot</p>
                </div>
              </div>
              
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.04] flex justify-between items-center">
                <span className="text-zinc-500 text-[9px] font-bold uppercase tracking-wider">Pengguna Aktif</span>
                <span className="font-bold text-white flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-violet-500 shadow-[0_0_8px_#a855f7]"></span>
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
