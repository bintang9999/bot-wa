import { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';

interface TransactionFormData {
  type: string;
  amount: string;
  category: string;
  description: string;
  date: string;
}

interface TransactionModalProps {
  formData: TransactionFormData;
  setFormData: (data: TransactionFormData) => void;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function TransactionModal({ formData, setFormData, onClose, onSubmit }: TransactionModalProps) {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/finance/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setCategories(data);
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div className="glass-premium w-full max-w-md rounded-3xl p-6 sm:p-8 relative shadow-2xl border border-white/10">
        
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white m-0">Catat Transaksi</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="flex flex-col gap-5">
          
          {/* Type Switcher */}
          <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/10 mb-1">
            <button type="button" 
              onClick={() => setFormData({...formData, type: 'pengeluaran'})}
              className={`flex-1 py-3 px-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${formData.type === 'pengeluaran' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              Pengeluaran
            </button>
            <button type="button"
              onClick={() => setFormData({...formData, type: 'pemasukan'})}
              className={`flex-1 py-3 px-2 text-sm font-bold rounded-xl transition-all cursor-pointer ${formData.type === 'pemasukan' ? 'bg-emerald-500 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
            >
              Pemasukan
            </button>
          </div>

          {/* Nominal */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Nominal</label>
            <div className="flex items-center w-full bg-white/5 hover:bg-white/10 focus-within:bg-white/10 focus:bg-white/10 border border-white/10 rounded-2xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all overflow-hidden">
              <div className="pl-5 pr-3 py-4 text-zinc-400 font-bold bg-white/5 border-r border-white/5">Rp</div>
              <input 
                type="text" 
                required
                className="flex-1 bg-transparent text-white text-xl font-bold py-4 px-4 outline-none w-full" 
                placeholder="0"
                value={formData.amount}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  const formatted = val ? new Intl.NumberFormat('id-ID').format(parseInt(val, 10)) : '';
                  setFormData({...formData, amount: formatted});
                }}
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Kategori</label>
            <div className="relative">
              <input 
                type="text"
                required
                list="kategori-list"
                placeholder="Ketik atau pilih kategori..."
                className="w-full bg-white/5 hover:bg-white/10 focus-within:bg-white/10 focus:bg-white/10 border border-white/10 rounded-2xl text-white text-sm py-4 pl-5 pr-12 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              />
              <datalist id="kategori-list">
                {categories.map(c => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Tanggal</label>
            <div className="relative">
              <input 
                type="date" 
                required
                className="w-full bg-white/5 hover:bg-white/10 focus-within:bg-white/10 focus:bg-white/10 border border-white/10 rounded-2xl text-white text-sm py-4 px-5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer outline-none [color-scheme:dark]"
                value={formData.date || ''}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
              />
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Catatan <span className="text-zinc-500 font-normal">(Opsional)</span></label>
            <input 
              type="text" 
              className="w-full bg-white/5 hover:bg-white/10 focus-within:bg-white/10 focus:bg-white/10 border border-white/10 rounded-2xl text-white text-sm py-4 px-5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none placeholder-white/20" 
              placeholder="Misal: Makan siang dengan klien"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>

          {/* Submit */}
          <button 
            type="submit" 
            className="w-full mt-2 py-4 rounded-2xl font-bold text-white text-base flex justify-center items-center gap-2 hover:opacity-90 transition-opacity shadow-lg cursor-pointer"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}
          >
            <Plus size={20} /> Simpan Transaksi
          </button>
        </form>
      </div>
    </div>
  );
}
