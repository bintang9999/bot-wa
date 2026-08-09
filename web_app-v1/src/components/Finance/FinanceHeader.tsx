import { Calendar, Plus } from 'lucide-react';

interface FinanceHeaderProps {
  period: string;
  setPeriod: (period: string) => void;
  onOpenModal: () => void;
}

export default function FinanceHeader({ period, setPeriod, onOpenModal }: FinanceHeaderProps) {
  return (
    <div className="mb-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
      
      <div className="flex flex-row gap-3 items-center w-full md:w-auto">
        <div className="flex-1 sm:flex-none flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 glass rounded-xl border-white/10 bg-[#141A28]/80 hover:bg-[#141A28] transition-colors">
          <Calendar size={16} className="text-zinc-400 ml-1 sm:ml-2 sm:w-[18px] sm:h-[18px]" />
          <select 
            value={period} 
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full bg-transparent border-none text-xs sm:text-sm outline-none text-white pr-1 cursor-pointer font-semibold"
          >
            <option value="hari" className="bg-[#141A28]">Hari Ini</option>
            <option value="minggu" className="bg-[#141A28]">Minggu Ini</option>
            <option value="bulan" className="bg-[#141A28]">Bulan Ini</option>
            <option value="tahun" className="bg-[#141A28]">Tahun Ini</option>
          </select>
        </div>
        <button 
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-6 sm:py-3 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)] cursor-pointer whitespace-nowrap active:scale-95 text-[11px] sm:text-sm" 
          onClick={onOpenModal}
        >
          <Plus size={14} className="sm:w-5 sm:h-5" /> Tambah Transaksi
        </button>
      </div>
    </div>
  );
}
