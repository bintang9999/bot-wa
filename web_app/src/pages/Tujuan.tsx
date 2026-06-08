import { useState, useEffect } from 'react';
import { Target, TrendingUp, AlertCircle, CheckCircle2, Plus, Edit2, Trash2, X } from 'lucide-react';

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  color: string;
  status: 'on_track' | 'at_risk' | 'completed';
}

export default function Tujuan() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    targetAmount: '',
    deadline: '',
    category: 'Umum',
    color: '#3b82f6'
  });

  const fetchGoals = async () => {
    try {
      const res = await fetch('/api/finance/goals');
      const data = await res.json();
      if (Array.isArray(data)) setGoals(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 size={20} className="text-emerald-500" />;
      case 'at_risk':
        return <AlertCircle size={20} className="text-red-500" />;
      default:
        return <TrendingUp size={20} className="text-blue-500" />;
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'at_risk':
        return 'bg-red-500';
      default:
        return 'bg-gradient-to-r from-blue-500 to-indigo-500';
    }
  };

  const handleSetorDana = async () => {
    if (!selectedGoalId || !amount) return;
    try {
      const res = await fetch(`/api/finance/goal/${selectedGoalId}/fund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amount.replace(/\./g, '') })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setAmount('');
        setSelectedGoalId(null);
        fetchGoals();
      } else {
        alert('Gagal menyetor dana');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...addFormData, targetAmount: addFormData.targetAmount.replace(/\./g, '') };
    try {
      const res = await fetch('/api/finance/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        setAddFormData({ name: '', targetAmount: '', deadline: '', category: 'Umum', color: '#3b82f6' });
        fetchGoals();
      } else {
        alert('Gagal menambah tujuan');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    if (!confirm('Yakin ingin menghapus tujuan ini?')) return;
    try {
      const res = await fetch(`/api/finance/goal/${id}`, { method: 'DELETE' });
      if (res.ok) fetchGoals();
      else alert('Gagal menghapus tujuan');
    } catch (err) {
      console.error(err);
    }
  };

  const openSetorModal = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsModalOpen(true);
  };

  return (
    <div className="animate-fade-in pb-12">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">Tujuan Keuangan</h1>
        <p className="text-sm font-medium text-zinc-400">Kelola target keuanganmu dan pantau progresnya</p>
      </div>

      {/* Add Goal Button */}
      <button 
        onClick={() => setIsAddModalOpen(true)}
        className="flex items-center gap-2 px-6 py-3 mb-8 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] font-bold cursor-pointer"
      >
        <Plus size={20} />
        <span className="text-sm">Tambah Tujuan</span>
      </button>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progress = (goal.currentAmount / goal.targetAmount) * 100;
          const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

          return (
            <div key={goal.id} className="glass-premium rounded-3xl p-6 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-[0_0_15px_currentColor]"
                    style={{
                      backgroundColor: goal.color + '20',
                      border: `2px solid ${goal.color}40`,
                      color: goal.color,
                    }}
                  >
                    <Target size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-white mb-1">{goal.name}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(goal.status)}
                      <span className="text-xs font-medium text-zinc-400">
                        {goal.status === 'completed' ? 'Selesai' : goal.status === 'at_risk' ? 'Berisiko' : 'On Track'}
                      </span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white">
                  <Edit2 size={16} />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-zinc-400">Progress</span>
                  <span className="text-sm font-bold text-white">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${getProgressColor(goal.status)} transition-all duration-300`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">Terkumpul</p>
                  <p className="text-xs font-bold text-white">{formatCurrency(goal.currentAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">Target</p>
                  <p className="text-xs font-bold text-white">{formatCurrency(goal.targetAmount)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 mb-1">Sisa Hari</p>
                  <p className={`text-xs font-bold ${daysLeft > 0 ? 'text-white' : 'text-red-500'}`}>
                    {daysLeft > 0 ? `${daysLeft}H` : 'Expired'}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => openSetorModal(goal.id)}
                  disabled={goal.status === 'completed'}
                  className="flex-1 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 disabled:bg-zinc-600/20 disabled:cursor-not-allowed text-indigo-400 disabled:text-zinc-400 rounded-lg transition-colors text-sm font-bold border border-indigo-500/30 disabled:border-zinc-600/30"
                >
                  {goal.status === 'completed' ? 'Selesai' : 'Setor Dana'}
                </button>
                <button 
                  onClick={() => handleDeleteGoal(goal.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-red-500 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Setor Dana */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-premium w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Setor Dana</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-zinc-400 mb-4">
                Masukkan jumlah yang ingin Anda setorkan untuk tujuan ini
              </p>

              <label className="block text-sm font-bold text-zinc-300 mb-2">Jumlah (Rp)</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const formatted = val ? new Intl.NumberFormat('id-ID').format(parseInt(val, 10)) : '';
                  setAmount(formatted);
                }}
                placeholder="0"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>

            {amount && (
              <div className="mb-6 p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <p className="text-xs text-zinc-400 mb-1">Total akan menjadi</p>
                <p className="text-lg font-bold text-indigo-400">
                  {formatCurrency(
                    (goals.find(g => g.id === selectedGoalId)?.currentAmount || 0) + parseInt(amount)
                  )}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleSetorDana}
                disabled={!amount || parseInt(amount) <= 0}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:from-zinc-600 disabled:to-zinc-600 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:shadow-none"
              >
                Setor Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Tambah Tujuan */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-premium w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Tambah Tujuan Baru</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddGoal} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Nama Tujuan</label>
                <input
                  type="text"
                  required
                  value={addFormData.name}
                  onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                  placeholder="Contoh: Beli Laptop Baru"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Target Uang (Rp)</label>
                <input
                  type="text"
                  required
                  value={addFormData.targetAmount}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    const formatted = val ? new Intl.NumberFormat('id-ID').format(parseInt(val, 10)) : '';
                    setAddFormData({ ...addFormData, targetAmount: formatted });
                  }}
                  placeholder="Contoh: 15.000.000"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Target Tanggal Penuh</label>
                <input
                  type="date"
                  required
                  value={addFormData.deadline}
                  onChange={(e) => setAddFormData({ ...addFormData, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">Kategori</label>
                  <input
                    type="text"
                    value={addFormData.category}
                    onChange={(e) => setAddFormData({ ...addFormData, category: e.target.value })}
                    placeholder="Misal: Impian"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-indigo-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">Warna Ikon</label>
                  <input
                    type="color"
                    value={addFormData.color}
                    onChange={(e) => setAddFormData({ ...addFormData, color: e.target.value })}
                    className="w-full h-[46px] px-1 py-1 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl cursor-pointer outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
              >
                Buat Tujuan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
