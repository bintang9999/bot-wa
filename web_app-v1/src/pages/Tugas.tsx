import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Plus,
  X,
  Trash2,
  Check,
  Circle,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  Filter,
  CheckCircle2,
  ListTodo,
  Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string | null;
  category: string;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

type FilterType = 'all' | 'active' | 'completed';

export default function Tugas() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    dueDate: '',
    category: 'Umum',
  });

  const fetchTasks = async () => {
    try {
      const res = await fetch('/api/tasks');
      const data = await res.json();
      if (Array.isArray(data)) setTasks(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ title: '', description: '', priority: 'medium', dueDate: '', category: 'Umum' });
        fetchTasks();
        toast.success('Tugas berhasil ditambahkan');
      } else {
        toast.error('Gagal menambahkan tugas');
      }
    } catch (err) {
      console.error(err);
      toast.error('Terjadi kesalahan');
    }
  };

  const handleToggleTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH' });
      if (res.ok) {
        fetchTasks();
        const task = tasks.find((t) => t.id === id);
        toast.success(task?.completed ? 'Tugas dibuka kembali' : 'Tugas selesai! 🎉');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTasks();
        toast.success('Tugas berhasil dihapus');
      }
    } catch (err) {
      console.error(err);
      toast.error('Gagal menghapus tugas');
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          icon: ArrowUp,
          label: 'Tinggi',
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          border: 'border-red-500/20',
          glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]',
        };
      case 'low':
        return {
          icon: ArrowDown,
          label: 'Rendah',
          color: 'text-blue-400',
          bg: 'bg-blue-500/10',
          border: 'border-blue-500/20',
          glow: '',
        };
      default:
        return {
          icon: ArrowRight,
          label: 'Sedang',
          color: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/20',
          glow: '',
        };
    }
  };

  const getDueDateStatus = (dueDate: string | null) => {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: 'Terlambat', color: 'text-red-400', bg: 'bg-red-500/10' };
    if (diffDays === 0) return { label: 'Hari Ini', color: 'text-orange-400', bg: 'bg-orange-500/10' };
    if (diffDays <= 3) return { label: `${diffDays} hari lagi`, color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    return { label: `${diffDays} hari lagi`, color: 'text-zinc-400', bg: 'bg-white/5' };
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const activeTasks = totalTasks - completedTasks;
  const highPriorityTasks = tasks.filter((t) => t.priority === 'high' && !t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="animate-fade-in pb-12">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <div className="glass-premium rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <ListTodo size={14} className="text-indigo-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total</span>
          </div>
          <span className="text-2xl font-bold text-white">{totalTasks}</span>
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="glass-premium rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
              <Clock size={14} className="text-yellow-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Aktif</span>
          </div>
          <span className="text-2xl font-bold text-yellow-400">{activeTasks}</span>
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-yellow-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="glass-premium rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
              <CheckCircle2 size={14} className="text-emerald-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Selesai</span>
          </div>
          <span className="text-2xl font-bold text-emerald-400">{completedTasks}</span>
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        <div className="glass-premium rounded-2xl p-4 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertTriangle size={14} className="text-red-400" />
            </div>
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Prioritas</span>
          </div>
          <span className="text-2xl font-bold text-red-400">{highPriorityTasks}</span>
          <div className="absolute -right-3 -bottom-3 w-16 h-16 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
        </div>
      </div>

      {/* Progress Bar */}
      {totalTasks > 0 && (
        <div className="glass-premium rounded-2xl p-5 mb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-xs font-bold text-zinc-400 flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-400" />
              Progress Keseluruhan
            </span>
            <span className="text-sm font-bold text-white">{completionRate}%</span>
          </div>
          <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Row */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <button
          id="add-task-btn"
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] font-bold cursor-pointer text-sm"
        >
          <Plus size={18} />
          Tambah Tugas
        </button>

        {/* Filter Chips */}
        <div className="flex gap-2">
          {([
            { key: 'all', label: 'Semua', icon: Filter },
            { key: 'active', label: 'Aktif', icon: Circle },
            { key: 'completed', label: 'Selesai', icon: Check },
          ] as const).map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                  filter === f.key
                    ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                    : 'bg-white/5 text-zinc-500 hover:text-zinc-300 border-white/5 hover:border-white/10'
                }`}
              >
                <Icon size={12} />
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Task List */}
      <div className="flex flex-col gap-3">
        {filteredTasks.length === 0 ? (
          <div className="glass-premium rounded-3xl p-12 text-center">
            <ClipboardList size={48} className="text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500 font-medium text-sm">
              {filter === 'completed' ? 'Belum ada tugas yang selesai' : filter === 'active' ? 'Semua tugas sudah selesai! 🎉' : 'Belum ada tugas. Tambahkan tugas pertama kamu!'}
            </p>
          </div>
        ) : (
          filteredTasks.map((task, index) => {
            const priorityConfig = getPriorityConfig(task.priority);
            const PriorityIcon = priorityConfig.icon;
            const dueDateStatus = getDueDateStatus(task.dueDate);

            return (
              <div
                key={task.id}
                className={`glass-premium rounded-2xl p-4 md:p-5 transition-all group ${
                  task.completed ? 'opacity-60' : ''
                } ${priorityConfig.glow}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-3 md:gap-4">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleToggleTask(task.id)}
                    className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer ${
                      task.completed
                        ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                        : 'border-zinc-600 hover:border-indigo-400 hover:bg-indigo-500/10 text-transparent hover:text-indigo-300'
                    }`}
                  >
                    <Check size={14} strokeWidth={3} />
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-sm font-bold mb-1 transition-all ${
                            task.completed ? 'line-through text-zinc-500' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-xs text-zinc-500 mb-2 line-clamp-2">{task.description}</p>
                        )}
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/10 rounded-lg transition-all text-zinc-600 hover:text-red-400 cursor-pointer flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Meta Row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Priority Badge */}
                      <span
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${priorityConfig.color} ${priorityConfig.bg} border ${priorityConfig.border}`}
                      >
                        <PriorityIcon size={10} />
                        {priorityConfig.label}
                      </span>

                      {/* Category */}
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-zinc-400 bg-white/5 border border-white/5">
                        {task.category}
                      </span>

                      {/* Due Date */}
                      {dueDateStatus && !task.completed && (
                        <span
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${dueDateStatus.color} ${dueDateStatus.bg}`}
                        >
                          <Clock size={10} />
                          {dueDateStatus.label}
                        </span>
                      )}

                      {/* Completed Date */}
                      {task.completed && task.completedAt && (
                        <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-emerald-400 bg-emerald-500/10">
                          <CheckCircle2 size={10} />
                          Selesai {new Date(task.completedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Tambah Tugas */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-premium w-full max-w-md rounded-3xl p-8 border border-white/10 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ClipboardList size={22} className="text-indigo-400" />
                Tugas Baru
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-zinc-400 hover:text-white cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Judul Tugas *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Apa yang harus dilakukan?"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Deskripsi</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detail tambahan (opsional)"
                  rows={3}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-indigo-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">Prioritas</label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map((p) => {
                      const config = getPriorityConfig(p);
                      const Icon = config.icon;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: p })}
                          className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                            formData.priority === p
                              ? `${config.bg} ${config.color} ${config.border}`
                              : 'bg-white/5 text-zinc-500 border-white/5 hover:border-white/10'
                          }`}
                        >
                          <Icon size={12} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-2">Kategori</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Umum"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white placeholder-zinc-500 focus:border-indigo-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-300 mb-2">Tenggat Waktu</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 focus:bg-white/10 rounded-xl text-white focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 mt-1 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] cursor-pointer"
              >
                Buat Tugas
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
