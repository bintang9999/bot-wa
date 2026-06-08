import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { ShoppingCart, Car, Coffee, Gamepad2, ShoppingBag, MoreHorizontal, Tag } from 'lucide-react';

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface CategoryExpensesProps {
  categoryData: CategoryData[];
  expense: number;
}

export default function CategoryExpenses({ categoryData, expense }: CategoryExpensesProps) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const getIcon = (index: number) => {
    const icons = [<ShoppingCart size={16} />, <Car size={16} />, <Coffee size={16} />, <Gamepad2 size={16} />, <ShoppingBag size={16} />, <MoreHorizontal size={16} />];
    return icons[index] || <Tag size={16} />;
  };

  return (
    <div className="glass-premium rounded-3xl p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-bold text-white mb-0">Pengeluaran Berdasarkan Kategori</h2>
        <button className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors">Lihat Semua</button>
      </div>
      
      <div className="flex flex-col xl:flex-row items-center gap-8 xl:gap-12 mt-4">
        {/* Category Donut */}
        <div className="w-48 h-48 relative flex-shrink-0 mx-auto xl:mx-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={2} dataKey="value" stroke="none"
              >
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xs text-zinc-400">Total</span>
            <span className="font-bold text-white text-base">{formatCurrency(expense)}</span>
          </div>
        </div>
        
        {/* Category Progress Bars */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
          {categoryData.slice(0, 6).map((cat, i) => {
            const percent = expense > 0 ? Math.round((cat.value / expense) * 100) : 0;
            return (
              <div key={i} className="flex items-center gap-4 p-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{backgroundColor: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}30`}}>
                  {getIcon(i)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-zinc-300 font-medium">{cat.name}</span>
                    <div className="flex gap-3">
                      <span className="font-bold text-white">{formatCurrency(cat.value)}</span>
                      <span className="text-zinc-500 w-8 text-right font-bold">{percent}%</span>
                    </div>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full shadow-[0_0_10px_currentColor]" style={{width: `${percent}%`, backgroundColor: cat.color, color: cat.color}}></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}
