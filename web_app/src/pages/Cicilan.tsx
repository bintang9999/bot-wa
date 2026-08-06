import { useState, useEffect } from 'react';
import { CreditCard, CheckCircle2, Plus, Trash2, X, Calculator, ArrowLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Payment { amount: number; date: string; }
interface Cicilan {
  id: string; name: string; totalAmount: number; collected: number;
  dueDate: number; status: 'active' | 'completed'; payments?: Payment[];
}

export default function Cicilan() {
  const [cicilans, setCicilans] = useState<Cicilan[]>([]);
  const [isSetorModalOpen, setIsSetorModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCicilanId, setSelectedCicilanId] = useState<string | null>(null);
  const [setorAmount, setSetorAmount] = useState('');
  const [detailCicilan, setDetailCicilan] = useState<Cicilan | null>(null);
  const [detailPayments, setDetailPayments] = useState<Payment[]>([]);
  const [dailyAmount, setDailyAmount] = useState('');
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedCalDate, setSelectedCalDate] = useState<number | null>(null);

  const [addFormData, setAddFormData] = useState({
    name: '',
    totalAmount: '',
    dueDate: '28'
  });

  const fetchCicilans = async () => {
    try {
      const res = await fetch('/api/finance/cicilans');
      const data = await res.json();
      if (Array.isArray(data)) setCicilans(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCicilans();
  }, []);

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR', 
      minimumFractionDigits: 0 
    }).format(val);

  const handleAddCicilan = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { 
      name: addFormData.name,
      totalAmount: addFormData.totalAmount.replace(/\./g, ''),
      dueDate: parseInt(addFormData.dueDate)
    };
    try {
      const res = await fetch('/api/finance/cicilan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setAddFormData({ name: '', totalAmount: '', dueDate: '28' });
        fetchCicilans();
        toast.success('Berhasil menambah cicilan');
      } else {
        toast.error('Gagal menambah cicilan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleSetorCicilan = async () => {
    if (!selectedCicilanId || !setorAmount) return;
    const cleanAmount = setorAmount.replace(/\./g, '');
    const numAmount = parseInt(cleanAmount);
    
    if (numAmount > 50000) {
      if (!confirm(`Setor lebih dari 50rb (${formatCurrency(numAmount)}). Lanjutkan?`)) return;
    }

    try {
      const res = await fetch(`/api/finance/cicilan/${selectedCicilanId}/setor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: cleanAmount })
      });
      if (res.ok) {
        setIsSetorModalOpen(false);
        setSetorAmount('');
        setSelectedCicilanId(null);
        fetchCicilans();
        toast.success('Berhasil menyetor cicilan');
      } else {
        toast.error('Gagal menyetor cicilan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleDeleteCicilan = async (id: string) => {
    if (!confirm('Yakin ingin menghapus cicilan ini?')) return;
    try {
      const res = await fetch(`/api/finance/cicilan/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchCicilans();
        toast.success('Cicilan berhasil dihapus');
      } else {
        toast.error('Gagal menghapus cicilan');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan');
    }
  };

  const openSetorModal = (cicilanId: string) => {
    setSelectedCicilanId(cicilanId);
    setIsSetorModalOpen(true);
  };

  const openDetail = async (cicilan: Cicilan) => {
    setDetailCicilan(cicilan);
    setDailyAmount('');
    setCalMonth(new Date().getMonth());
    setCalYear(new Date().getFullYear());
    try {
      const res = await fetch(`/api/finance/cicilan/${cicilan.id}/payments`);
      const data = await res.json();
      setDetailPayments(Array.isArray(data) ? data : []);
    } catch { setDetailPayments([]); }
  };

  // Calendar helpers
  const monthNames = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
  const dayNames = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
  const getDaysInMonth = (m: number, y: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDay = (m: number, y: number) => new Date(y, m, 1).getDay();
  const paymentDates = new Set(detailPayments.map(p => new Date(p.date).toDateString()));

  // Detail view
  if (detailCicilan) {
    const c = detailCicilan;
    const remaining = c.totalAmount - c.collected;
    const progress = (c.collected / c.totalAmount) * 100;
    const rawD = dailyAmount.replace(/\./g, '');
    const dNum = parseInt(rawD) || 0;
    const daysNeeded = dNum > 0 ? Math.ceil(remaining / dNum) : 0;
    const payoffDate = daysNeeded > 0 ? (() => { const d = new Date(); d.setDate(d.getDate() + daysNeeded); return d; })() : null;
    const daysInMonth = getDaysInMonth(calMonth, calYear);
    const firstDay = getFirstDay(calMonth, calYear);
    const today = new Date();

    const handleCalendarSetor = async () => {
      if (!setorAmount || !detailCicilan) return;
      const cleanAmount = setorAmount.replace(/\./g, '');
      const numAmount = parseInt(cleanAmount);
      if (numAmount > 50000) {
        if (!confirm(`Setor lebih dari 50rb (${formatCurrency(numAmount)}). Lanjutkan?`)) return;
      }
      try {
        const res = await fetch(`/api/finance/cicilan/${detailCicilan.id}/setor`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount: cleanAmount })
        });
        if (res.ok) {
          const updated = await res.json();
          setSetorAmount('');
          setSelectedCalDate(null);
          fetchCicilans();
          // Refresh detail data
          const paymentsRes = await fetch(`/api/finance/cicilan/${detailCicilan.id}/payments`);
          const paymentsData = await paymentsRes.json();
          setDetailPayments(Array.isArray(paymentsData) ? paymentsData : []);
          if (updated.cicilan) setDetailCicilan(updated.cicilan);
          toast.success('Berhasil menyetor cicilan');
        } else {
          toast.error('Gagal menyetor cicilan');
        }
      } catch (err) {
        console.error(err);
        toast.error('Terjadi kesalahan');
      }
    };

    return (
      <div className="animate-fade-in pb-12">
        <button onClick={() => { setDetailCicilan(null); setSelectedCalDate(null); }} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors cursor-pointer">
          <ArrowLeft size={18} /><span className="text-sm font-bold">Kembali</span>
        </button>

        {/* 1. Calendar — TOP (Merged with Cicilan Info) */}
        <div className="glass-premium rounded-3xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border-2 border-indigo-500/40 flex items-center justify-center">
                <CreditCard size={20} className="text-indigo-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{c.name}</h2>
                <p className="text-xs text-indigo-400">Jatuh Tempo: Tgl {c.dueDate}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer">‹</button>
            <h3 className="text-sm font-bold text-white">{monthNames[calMonth]} {calYear}</h3>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors cursor-pointer">›</button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map(d => <div key={d} className="text-center text-[10px] text-zinc-500 font-bold py-1">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = new Date(calYear, calMonth, day).toDateString();
              const hasPay = paymentDates.has(dateStr);
              const isToday = today.getDate() === day && today.getMonth() === calMonth && today.getFullYear() === calYear;
              const isSelectedDay = selectedCalDate === day;
              const dayPayments = detailPayments.filter(p => new Date(p.date).toDateString() === dateStr);
              const totalPaid = dayPayments.reduce((s, p) => s + p.amount, 0);
              const isFutureDay = new Date(calYear, calMonth, day) > today;

              return (
                <div
                  key={day}
                  onClick={() => {
                    if (!isFutureDay && remaining > 0) {
                      setSelectedCalDate(isSelectedDay ? null : day);
                      setSetorAmount('');
                    }
                  }}
                  className={`relative aspect-square flex flex-col items-center justify-center rounded-xl p-1 text-xs transition-all cursor-pointer overflow-hidden
                    ${isSelectedDay ? 'bg-indigo-500/30 border-2 border-indigo-400 ring-2 ring-indigo-500/20 scale-105 z-10' : ''}
                    ${!isSelectedDay && hasPay ? 'bg-emerald-500/25 border-2 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.35)]' : ''}
                    ${!isSelectedDay && !hasPay && isToday ? 'bg-indigo-500/10 border border-indigo-500/30' : ''}
                    ${!isSelectedDay && !hasPay && !isToday ? 'bg-white/[0.02] border border-transparent hover:border-white/10 hover:bg-white/5' : ''}
                    ${isFutureDay ? 'opacity-30 cursor-default' : ''}
                  `}
                  title={hasPay ? `Setor ${formatCurrency(totalPaid)}` : isToday ? 'Hari ini' : ''}
                >
                  <span className={`font-bold ${isSelectedDay ? 'text-indigo-300' : hasPay ? 'text-emerald-300' : isToday ? 'text-indigo-400' : 'text-zinc-400'}`}>{day}</span>
                  {hasPay && (
                    <span className="text-[9px] font-black text-emerald-300 leading-none mt-0.5 truncate max-w-full">
                      {totalPaid >= 1000 ? `${Math.round(totalPaid / 1000)}k` : totalPaid}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Inline Setor Form — when date clicked */}
          {selectedCalDate !== null && remaining > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in">
              <div className="p-4 bg-gradient-to-br from-indigo-500/10 via-violet-500/5 to-transparent rounded-2xl border border-indigo-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                      <Plus size={14} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Setor Cicilan</p>
                      <p className="text-[10px] text-zinc-400">Tanggal {selectedCalDate} {monthNames[calMonth]} {calYear}</p>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCalDate(null); setSetorAmount(''); }} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white cursor-pointer">
                    <X size={14} />
                  </button>
                </div>

                <input
                  type="text"
                  inputMode="numeric"
                  value={setorAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setSetorAmount(val ? new Intl.NumberFormat('id-ID').format(parseInt(val)) : '');
                  }}
                  placeholder="Masukkan nominal setor"
                  className="w-full px-3 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all mb-3"
                  autoFocus
                />

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[10000, 20000, 30000, 50000].map(a => (
                    <button
                      key={a}
                      onClick={() => setSetorAmount(new Intl.NumberFormat('id-ID').format(a))}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border cursor-pointer transition-all ${
                        parseInt(setorAmount.replace(/\./g, '')) === a
                          ? 'bg-indigo-500/30 border-indigo-500/50 text-indigo-300'
                          : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'
                      }`}
                    >
                      {a / 1000}k
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCalendarSetor}
                  disabled={!setorAmount || parseInt(setorAmount.replace(/\./g, '')) <= 0}
                  className="w-full py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:from-zinc-700 disabled:to-zinc-700 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:shadow-none cursor-pointer disabled:cursor-not-allowed"
                >
                  Setor {setorAmount ? formatCurrency(parseInt(setorAmount.replace(/\./g, ''))) : 'Sekarang'}
                </button>
              </div>
            </div>
          )}

          {/* Progress Section — inside calendar card at bottom */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Progress</span>
              <span className="text-xl font-black text-white">{Math.round(progress)}%</span>
            </div>
            <div className="relative w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5">
              <div className="absolute top-0 left-0 h-full blur-md opacity-60 bg-indigo-500" style={{ width: `${Math.min(progress, 100)}%` }} />
              <div className="relative h-full bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="grid grid-cols-3 gap-3 mt-4 p-3 bg-white/5 rounded-xl border border-white/5">
              <div className="text-center"><p className="text-xs text-zinc-500 mb-1">Terkumpul</p><p className="text-xs font-bold text-white">{formatCurrency(c.collected)}</p></div>
              <div className="text-center"><p className="text-xs text-zinc-500 mb-1">Total</p><p className="text-xs font-bold text-white">{formatCurrency(c.totalAmount)}</p></div>
              <div className="text-center"><p className="text-xs text-zinc-500 mb-1">Kurang</p><p className={`text-xs font-bold ${remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{formatCurrency(remaining)}</p></div>
            </div>
          </div>
        </div>

        {/* 2. Estimasi Calculator — BELOW Calendar Card */}
        {remaining > 0 && (
          <div className="glass-premium rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator size={16} className="text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Estimasi Lunas</h3>
            </div>
            <label className="block text-[10px] text-zinc-400 mb-2 uppercase tracking-wider font-bold">Setor per hari (Rp)</label>
            <input type="text" inputMode="numeric" value={dailyAmount} onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '');
              setDailyAmount(v ? new Intl.NumberFormat('id-ID').format(parseInt(v)) : '');
            }} placeholder="Masukkan nominal" className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all mb-3" />
            <div className="flex flex-wrap gap-2 mb-4">
              {[10000, 20000, 30000, 50000].map(a => (
                <button key={a} onClick={() => setDailyAmount(new Intl.NumberFormat('id-ID').format(a))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${dNum === a ? 'bg-indigo-500/30 border-indigo-500/50 text-indigo-300' : 'bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10'}`}>
                  {a/1000}k
                </button>
              ))}
            </div>
            {payoffDate && (
              <div className="p-4 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-sm font-bold text-white">📅 Lunas tanggal <span className="text-indigo-400">{payoffDate.getDate()} {monthNames[payoffDate.getMonth()]} {payoffDate.getFullYear()}</span></p>
                <p className="text-xs text-zinc-400 mt-1">⏱️ <span className="text-indigo-300 font-semibold">{daysNeeded} hari</span> lagi dengan setor {formatCurrency(dNum)}/hari</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12">
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="flex items-center gap-2 px-6 py-3 mb-8 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] font-bold cursor-pointer"
      >
        <Plus size={20} />
        <span className="text-sm">Tambah Cicilan</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cicilans.map((cicilan) => {
          const progress = (cicilan.collected / cicilan.totalAmount) * 100;
          const remaining = cicilan.totalAmount - cicilan.collected;
          const isCompleted = cicilan.status === 'completed';

          return (
            <div 
              key={cicilan.id} 
              onClick={() => openDetail(cicilan)}
              className="glass-premium rounded-3xl p-6 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all cursor-pointer group hover:border-indigo-500/40"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-[0_0_15px_currentColor] ${
                      isCompleted ? 'bg-emerald-500/20 border-2 border-emerald-500/40' : 'bg-indigo-500/20 border-2 border-indigo-500/40'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={20} className="text-emerald-500" />
                    ) : (
                      <CreditCard size={20} className="text-indigo-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">{cicilan.name}</h3>
                    <span className={`text-xs font-medium ${isCompleted ? 'text-emerald-400' : 'text-indigo-400'}`}>
                      {isCompleted ? 'Lunas' : `Jatuh Tempo: Tgl ${cicilan.dueDate}`}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCicilan(cicilan.id);
                  }}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Progress</span>
                  <div className="text-right">
                    <span className="text-xl font-black text-white">{Math.round(progress)}%</span>
                  </div>
                </div>
                
                <div className="relative w-full h-3 bg-black/40 rounded-full overflow-hidden border border-white/5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                  <div 
                    className={`absolute top-0 left-0 h-full blur-md opacity-60 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                  <div
                    className={`relative h-full transition-all duration-1000 ease-out rounded-full ${
                      isCompleted 
                        ? 'bg-gradient-to-r from-emerald-600 to-emerald-400' 
                        : 'bg-gradient-to-r from-indigo-600 via-violet-500 to-fuchsia-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-white/30 rounded-full" />
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">Terkumpul</p>
                  <p className="text-xs font-bold text-white">{formatCurrency(cicilan.collected)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">Total</p>
                  <p className="text-xs font-bold text-white">{formatCurrency(cicilan.totalAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">Kurang</p>
                  <p className={`text-xs font-bold ${remaining > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {formatCurrency(remaining)}
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openSetorModal(cicilan.id);
                }}
                disabled={isCompleted}
                className="w-full py-2 bg-indigo-500/20 hover:bg-indigo-500/30 disabled:bg-zinc-600/20 disabled:cursor-not-allowed text-indigo-400 disabled:text-zinc-400 rounded-lg transition-colors text-sm font-bold border border-indigo-500/30 disabled:border-zinc-600/30"
              >
                {isCompleted ? 'Sudah Lunas' : 'Setor Cicilan'}
              </button>
            </div>
          );
        })}
      </div>

      {cicilans.length === 0 && (
        <div className="text-center py-12">
          <CreditCard size={48} className="mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400">Belum ada cicilan. Buat cicilan baru untuk memulai.</p>
        </div>
      )}

      {/* Modal Setor Cicilan */}
      {isSetorModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-premium w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Setor Cicilan</h2>
              <button
                onClick={() => setIsSetorModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-zinc-400 mb-4">
                Masukkan jumlah setor (hingga 50rb per transaksi)
              </p>

              <label className="block text-sm font-bold text-zinc-300 mb-2">Jumlah (Rp)</label>
              <input
                type="text"
                value={setorAmount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const formatted = val ? new Intl.NumberFormat('id-ID').format(parseInt(val, 10)) : '';
                  setSetorAmount(formatted);
                }}
                placeholder="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
            
              <div className="mt-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <div className="flex flex-wrap justify-center gap-2">
                  {[20000, 30000, 40000, 50000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setSetorAmount(new Intl.NumberFormat('id-ID').format(amount))}
                      className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 hover:border-amber-500/50 rounded-lg text-xs text-amber-300 font-semibold transition-all"
                    >
                      {amount / 1000}k
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {setorAmount && (
              <div className="mb-6 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-lg font-bold text-indigo-400">
                  {formatCurrency(
                    (cicilans.find(c => c.id === selectedCicilanId)?.collected || 0) + parseInt(setorAmount.replace(/\./g, ''))
                  )}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsSetorModalOpen(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSetorCicilan}
                disabled={!setorAmount || parseInt(setorAmount.replace(/\./g, '')) <= 0}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:from-zinc-600 disabled:to-zinc-600 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:shadow-none"
              >
                Setor Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Tambah Cicilan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-premium w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Tambah Cicilan Baru</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddCicilan} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Nama Cicilan</label>
                <input
                  type="text"
                  required
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  placeholder="Contoh: Cicilan Mobil"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Total Cicilan (Rp)</label>
                <input
                  type="text"
                  required
                  value={addFormData.totalAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const formatted = val ? new Intl.NumberFormat('id-ID').format(parseInt(val, 10)) : '';
                    setAddFormData({ ...addFormData, totalAmount: formatted });
                  }}
                  placeholder="Contoh: 30.000.000"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Tanggal Jatuh Tempo</label>
                <select
                  value={addFormData.dueDate}
                  onChange={(e) => setAddFormData({ ...addFormData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white focus:border-indigo-500 outline-none transition-all"
                >
                  {[...Array(31)].map((_, i) => (
                    <option key={i + 1} value={i + 1} className="bg-zinc-900">
                      Tanggal {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                Buat Cicilan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
