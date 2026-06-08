import { useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Wallet, Plus, X, Trash2 } from 'lucide-react';

export interface EWallet {
  id: string;
  name: string;
  balance: number;
  color: string;
}

interface SummaryCardsProps {
  income: number;
  expense: number;
  balance: number;
  cashBalance: number;
  eWallets: EWallet[];
  onAddEWallet: (wallet: Omit<EWallet, 'id'>) => void;
  onDeleteEWallet?: (id: string) => void;
}

export default function SummaryCards({ income, expense, balance, cashBalance, eWallets, onAddEWallet, onDeleteEWallet }: SummaryCardsProps) {
  const [expandedCard, setExpandedCard] = useState<'income' | 'expense' | 'balance' | null>(null);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const toggleCard = (card: 'income' | 'expense' | 'balance') => {
    if (expandedCard === card) setExpandedCard(null);
    else setExpandedCard(card);
  };

  const handleAddWallet = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const balanceStr = (formData.get('balance') as string).replace(/\./g, '');
    const initialBalance = Number(balanceStr);
    const color = formData.get('color') as string;
    
    if (name && !isNaN(initialBalance)) {
      onAddEWallet({ name, balance: initialBalance, color: color || '#3b82f6' });
      setShowAddWalletModal(false);
    }
  };

  const handleDeleteWallet = (id: string) => {
    if (confirm('Yakin ingin menghapus E-Wallet ini?')) {
      onDeleteEWallet?.(id);
    }
  };

  return (
    <>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
         
         {/* Card 1: Pemasukan */}
         <div 
           className="glass-premium rounded-3xl relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgba(16,185,129,0.15)] group"
           onClick={() => toggleCard('income')}
           style={{ height: expandedCard === 'income' ? 'auto' : 'auto', minHeight: '220px', padding: '32px' }}
         >
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2 mb-2 text-zinc-400 text-sm">
                Total Pemasukan <TrendingUp size={14} className="text-emerald-500" />
              </div>
              <div className="text-2xl xl:text-3xl font-bold text-emerald-500 mb-2">{formatCurrency(income)}</div>
              <div className="text-xs text-emerald-500 flex items-center gap-1">
                <ArrowUpRight size={14} /> +18% dari bulan lalu
              </div>
            </div>
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)] group-hover:bg-emerald-500/20 transition-colors">
              <ArrowDownRight size={20} className="text-emerald-500" />
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-16 opacity-80 pointer-events-none">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,20 C20,25 30,5 50,15 C70,25 80,10 100,10 L100,30 L0,30 Z" fill="url(#gradGreen)" opacity="0.15"/>
              <path d="M0,20 C20,25 30,5 50,15 C70,25 80,10 100,10" fill="none" stroke="#10b981" strokeWidth="2" style={{filter: 'drop-shadow(0 0 4px #10b981)'}}/>
              <defs>
                <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="1" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {expandedCard === 'income' && (
             <div className="mt-4 pt-4 border-t border-white/10 relative z-10 animate-fade-in">
               <div className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-bold">Detail Pemasukan Bulan Ini:</div>
               <div className="flex justify-between text-sm mb-1.5"><span className="text-zinc-300">Gaji Pokok</span><span className="text-emerald-500">{formatCurrency(income * 0.8)}</span></div>
               <div className="flex justify-between text-sm mb-1.5"><span className="text-zinc-300">Freelance</span><span className="text-emerald-500">{formatCurrency(income * 0.15)}</span></div>
               <div className="flex justify-between text-sm"><span className="text-zinc-300">Lainnya</span><span className="text-emerald-500">{formatCurrency(income * 0.05)}</span></div>
             </div>
          )}
        </div>

         {/* Card 2: Pengeluaran */}
         <div 
           className="glass-premium rounded-3xl relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgba(239,68,68,0.15)] group"
           onClick={() => toggleCard('expense')}
           style={{ height: expandedCard === 'expense' ? 'auto' : 'auto', minHeight: '220px', padding: '32px' }}
         >
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2 mb-2 text-zinc-400 text-sm">
                Total Pengeluaran <TrendingDown size={14} className="text-red-500" />
              </div>
              <div className="text-2xl xl:text-3xl font-bold text-red-500 mb-2">{formatCurrency(expense)}</div>
              <div className="text-xs text-red-500 flex items-center gap-1">
                <ArrowUpRight size={14} /> +8% dari bulan lalu
              </div>
            </div>
            <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)] group-hover:bg-red-500/20 transition-colors">
              <ArrowUpRight size={20} className="text-red-500" />
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-16 opacity-80 pointer-events-none">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,15 C20,10 30,25 50,20 C70,15 80,25 100,20 L100,30 L0,30 Z" fill="url(#gradRed)" opacity="0.15"/>
              <path d="M0,15 C20,10 30,25 50,20 C70,15 80,25 100,20" fill="none" stroke="#ef4444" strokeWidth="2" style={{filter: 'drop-shadow(0 0 4px #ef4444)'}}/>
              <defs>
                <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="1" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {expandedCard === 'expense' && (
             <div className="mt-4 pt-4 border-t border-white/10 relative z-10 animate-fade-in">
               <div className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-bold">Pengeluaran Terbesar:</div>
               <div className="flex justify-between text-sm mb-1.5"><span className="text-zinc-300">Kebutuhan</span><span className="text-red-500">{formatCurrency(expense * 0.4)}</span></div>
               <div className="flex justify-between text-sm mb-1.5"><span className="text-zinc-300">Tagihan</span><span className="text-red-500">{formatCurrency(expense * 0.3)}</span></div>
               <div className="flex justify-between text-sm"><span className="text-zinc-300">Lainnya</span><span className="text-red-500">{formatCurrency(expense * 0.3)}</span></div>
             </div>
          )}
        </div>

         {/* Card 3: Sisa Saldo */}
         <div 
           className="glass-premium rounded-3xl relative overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgba(59,130,246,0.15)] group"
           onClick={() => toggleCard('balance')}
           style={{ height: expandedCard === 'balance' ? 'auto' : 'auto', minHeight: '220px', padding: '32px' }}
         >
          <div className="flex justify-between items-start z-10">
            <div>
              <div className="flex items-center gap-2 mb-2 text-zinc-400 text-sm">
                Sisa Saldo <TrendingUp size={14} className="text-blue-500" />
              </div>
              <div className="text-2xl xl:text-3xl font-bold text-blue-500 mb-2">{formatCurrency(balance)}</div>
              <div className="text-xs text-blue-500 flex items-center gap-1">
                <ArrowUpRight size={14} /> +25% dari bulan lalu
              </div>
            </div>
            <div className="p-2 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)] group-hover:bg-blue-500/20 transition-colors">
              <Wallet size={20} className="text-blue-500" />
            </div>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full h-16 opacity-80 pointer-events-none">
            <svg viewBox="0 0 100 30" preserveAspectRatio="none" className="w-full h-full">
              <path d="M0,25 C15,10 25,15 40,20 C60,25 75,10 100,15 L100,30 L0,30 Z" fill="url(#gradBlue)" opacity="0.15"/>
              <path d="M0,25 C15,10 25,15 40,20 C60,25 75,10 100,15" fill="none" stroke="#3b82f6" strokeWidth="2" style={{filter: 'drop-shadow(0 0 4px #3b82f6)'}}/>
              <defs>
                <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {expandedCard === 'balance' && (
             <div className="mt-4 pt-4 border-t border-white/10 relative z-10 animate-fade-in" onClick={(e) => e.stopPropagation()}>
               <div className="text-xs text-zinc-400 mb-2 uppercase tracking-wider font-bold">Alokasi Saldo:</div>
               <div className="flex justify-between text-sm mb-3 pb-3 border-b border-white/5">
                 <span className="text-zinc-300 flex items-center gap-2"><Wallet size={14} className="text-emerald-400"/> Cash Tunai</span>
                 <span className="font-bold text-white">{formatCurrency(cashBalance)}</span>
               </div>
               
               <div className="text-[10px] text-zinc-500 mb-2 font-bold tracking-wider uppercase">E-Wallet</div>
               <div className="max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                 {eWallets.length === 0 && <div className="text-xs text-zinc-500 mb-2">Belum ada E-Wallet</div>}
                 {eWallets.map(ew => (
                   <div key={ew.id} className="flex justify-between items-center text-sm mb-2 group/ew">
                     <span className="text-zinc-300 flex items-center gap-2">
                       <div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: ew.color, boxShadow: `0 0 5px ${ew.color}`}}></div> 
                       {ew.name}
                     </span>
                     <div className="flex items-center gap-2">
                       <span className="font-medium text-white">{formatCurrency(ew.balance)}</span>
                       <button onClick={() => handleDeleteWallet(ew.id)} className="opacity-0 group-hover/ew:opacity-100 text-red-500 hover:text-red-400 p-1 rounded-md hover:bg-red-500/10 transition-all">
                         <Trash2 size={12} />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
               
               <button 
                 onClick={() => setShowAddWalletModal(true)}
                 className="w-full mt-3 py-2 border border-dashed border-indigo-500/30 rounded-xl text-xs font-bold text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-colors flex items-center justify-center gap-1"
               >
                 <Plus size={14} /> Tambah E-Wallet
               </button>
             </div>
          )}
        </div>
      </div>

      {/* Add E-Wallet Modal */}
      {showAddWalletModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="glass-premium w-full max-w-sm rounded-3xl p-6 relative shadow-2xl border border-white/10 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white m-0">Tambah E-Wallet</h2>
              <button onClick={() => setShowAddWalletModal(false)} className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={handleAddWallet} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Nama E-Wallet</label>
                <input name="name" type="text" required className="w-full bg-white/5 hover:bg-white/10 focus-within:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl text-white text-sm py-3 px-4 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none" placeholder="Misal: Dana, OVO, ShopeePay" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Saldo Awal</label>
                <div className="flex items-center w-full bg-white/5 hover:bg-white/10 focus-within:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 overflow-hidden">
                  <div className="pl-4 pr-2 py-3 text-zinc-400 font-bold bg-white/5 border-r border-white/5">Rp</div>
                  <input 
                    name="balance" 
                    type="text" 
                    required 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      e.target.value = val ? new Intl.NumberFormat('id-ID').format(parseInt(val, 10)) : '';
                    }}
                    className="flex-1 bg-transparent text-white text-sm font-bold py-3 px-3 outline-none" 
                    placeholder="0" 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Warna E-Wallet</label>
                <div className="flex gap-3 items-center">
                  <input name="color" type="color" defaultValue="#118EEA" className="w-12 h-10 bg-white/5 hover:bg-white/10 focus-within:bg-white/10 focus:bg-white/10 border border-white/10 rounded-xl cursor-pointer p-1" />
                  <span className="text-xs text-zinc-500">Pilih warna ikon yang sesuai</span>
                </div>
              </div>
              
              <button type="submit" className="w-full mt-4 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 transition-colors shadow-[0_4px_15px_rgba(99,102,241,0.4)] flex justify-center items-center gap-2">
                <Plus size={16} /> Simpan E-Wallet
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
