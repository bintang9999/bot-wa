import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

interface FinancialSummaryProps {
  income: number;
  expense: number;
  balance: number;
  barChartData: any[];
}

export default function FinancialSummary({ income, expense, balance, barChartData }: FinancialSummaryProps) {
  const formatCurrency = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val || 0);

  const totalIncomeExpense = income + expense;
  const incomePercent = totalIncomeExpense > 0 ? Math.round((income / totalIncomeExpense) * 100) : 0;
  const expensePercent = totalIncomeExpense > 0 ? Math.round((expense / totalIncomeExpense) * 100) : 0;

  return (
    <div className="glass-premium rounded-3xl p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-lg font-bold text-white mb-0">Ringkasan Keuangan</h2>
        <select className="bg-transparent text-xs font-bold text-zinc-400 outline-none cursor-pointer hover:text-zinc-300 transition-colors">
          <option value="bulan" className="bg-[#141A28]">Bulan Ini</option>
        </select>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Donut Chart Pemasukan vs Pengeluaran */}
        <div className="flex flex-col h-full">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8 flex-1">
            <div className="w-36 h-36 relative flex-shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[{value: income, color: '#10b981'}, {value: expense, color: '#ef4444'}]}
                    cx="50%" cy="50%" innerRadius={55} outerRadius={70} paddingAngle={2} dataKey="value" stroke="none"
                  >
                    <Cell fill="#ffffffff" />
                    <Cell fill="#ef4444" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-zinc-400">Surplus</span>
                <span className="font-bold text-white text-xs">{formatCurrency(balance)}</span>
              </div>
            </div>
            <div className="flex flex-col gap-4 flex-1 w-full">
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2 text-zinc-400"><div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_#10b981]"></div> Pemasukan</div>
                  <span className="text-emerald-500 font-bold">{incomePercent}%</span>
                </div>
                <div className="text-sm font-bold text-white">{formatCurrency(income)}</div>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2 text-zinc-400"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]"></div> Pengeluaran</div>
                  <span className="text-red-500 font-bold">{expensePercent}%</span>
                </div>
                <div className="text-sm font-bold text-white">{formatCurrency(expense)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tren 6 Bulan Terakhir */}
        <div className="flex flex-col h-full mt-6 xl:mt-0">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-zinc-400 mb-0">Tren 6 Bulan Terakhir</h3>
            <div className="flex items-center gap-3 text-[10px] text-zinc-400">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-emerald-500"></div> Pemasukan</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-red-500"></div> Pengeluaran</div>
            </div>
          </div>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} dy={5} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 10}} tickFormatter={(val) => `${val/1000000}jt`} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{backgroundColor: '#18181b', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px'}}
                  formatter={(value: any) => formatCurrency(value as number)}
                />
                <Bar dataKey="pemasukan" fill="#10b981" radius={[2, 2, 0, 0]} barSize={8} />
                <Bar dataKey="pengeluaran" fill="#ef4444" radius={[2, 2, 0, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
