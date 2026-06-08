import { Star } from 'lucide-react';

export default function MotivationBanner() {
  return (
    <div className="relative glass-premium rounded-3xl p-6 bg-gradient-to-r from-indigo-950/80 to-[#1e1a3b]/80 border border-indigo-500/20 flex items-center justify-between gap-4 overflow-hidden mb-8">
      <div className="flex items-center gap-4 z-10">
        <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.5)]">
          <Star size={24} className="fill-current" />
        </div>
        <h3 className="font-bold text-white text-sm md:text-base mb-0">Tetap konsisten, masa depan finansialmu dimulai dari sekarang! 🚀</h3>
      </div>
      
      {/* Right side floating wallet graphic simulation */}
      <div className="relative w-32 h-20 hidden md:block z-10">
        <div className="absolute right-0 bottom-0 w-20 h-16 bg-purple-600 rounded-xl shadow-[0_10px_30px_rgba(147,51,234,0.5)] rotate-[-5deg] border-t-4 border-purple-400">
          <div className="w-full h-1/2 bg-purple-800 rounded-b-xl absolute bottom-0"></div>
          <div className="absolute -top-3 right-2 w-10 h-6 bg-emerald-400 rounded-md rotate-[15deg]"></div>
          <div className="absolute -top-4 left-2 w-10 h-6 bg-red-400 rounded-md rotate-[-10deg]"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.8)]"></div>
        </div>
        {/* Floating Coins */}
        <div className="absolute top-0 right-16 w-4 h-4 bg-yellow-400 rounded-full shadow-[0_0_15px_rgba(250,204,21,0.8)] animate-bounce"></div>
        <div className="absolute bottom-4 -left-4 w-5 h-5 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)]"></div>
      </div>
      
      <div className="absolute top-0 right-10 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-32 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2"></div>
    </div>
  );
}
