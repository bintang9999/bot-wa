import { useState, useEffect } from 'react';
import FinanceHeader from '../components/Finance/FinanceHeader';
import SummaryCards from '../components/Finance/SummaryCards';
import type { EWallet } from '../components/Finance/SummaryCards';
import FinancialSummary from '../components/Finance/FinancialSummary';
import CategoryExpenses from '../components/Finance/CategoryExpenses';
import RecentTransactions from '../components/Finance/RecentTransactions';
import MotivationBanner from '../components/Finance/MotivationBanner';
import TransactionModal from '../components/Finance/TransactionModal';

interface FinanceSummary {
  income: number;
  expense: number;
  balance: number;
  categories?: Record<string, number>;
}

export default function Finance() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [period, setPeriod] = useState<string>('bulan');
  const [loading, setLoading] = useState<boolean>(true);
  const [recentTransactions, setRecentTransactions] = useState<{ id: string; type: 'pemasukan'|'pengeluaran'; amount: number; category: string; date: string; description: string; }[]>([]);
  const [dynamicCategoryData, setDynamicCategoryData] = useState<{ name: string; value: number; color: string; }[]>([]);
  const [trendData, setTrendData] = useState<{ name: string; pemasukan: number; pengeluaran: number; }[]>([]);
  
  // State for E-Wallets
  const [eWallets, setEWallets] = useState<EWallet[]>([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    type: 'pengeluaran',
    amount: '',
    category: '',
    description: ''
  });

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const fetchData = async (p: string) => {
    setLoading(true);
    try {
      const [sumRes, txRes, ewRes, trendRes] = await Promise.all([
        fetch(`/api/finance/summary?period=${p}`).then(res => res.json()),
        fetch('/api/finance/transactions?limit=5').then(res => res.json()),
        fetch('/api/finance/ewallets').then(res => res.json()),
        fetch('/api/finance/trend').then(res => res.json())
      ]);
      setSummary(sumRes);
      
      if (Array.isArray(txRes)) {
        setRecentTransactions(txRes);
      }
      
      if (Array.isArray(ewRes)) {
        setEWallets(ewRes);
      }
      
      if (Array.isArray(trendRes)) {
        setTrendData(trendRes);
      }

      if (sumRes && sumRes.categories) {
        const catMap = sumRes.categories;
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6b7280'];
        let colorIdx = 0;
        const newCatData = Object.keys(catMap).map(name => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          value: catMap[name],
          color: colors[colorIdx++ % colors.length]
        }));
        setDynamicCategoryData(newCatData);
      } else {
        setDynamicCategoryData([]);
      }
    } catch (error) {
      console.error('Error fetching finance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...formData, amount: formData.amount.replace(/\./g, '') };
    try {
      const res = await fetch('/api/finance/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setFormData({ type: 'pengeluaran', amount: '', category: '', description: '' });
        fetchData(period); // Refresh data
      } else {
        alert("Gagal menambahkan transaksi");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    }
  };

  const handleAddEWallet = async (wallet: Omit<EWallet, 'id'>) => {
    try {
      const res = await fetch('/api/finance/ewallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wallet)
      });
      if (res.ok) {
        fetchData(period);
      } else {
        alert("Gagal menambahkan E-Wallet");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    }
  };

  const handleDeleteEWallet = async (id: string) => {
    try {
      const res = await fetch(`/api/finance/ewallet/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchData(period);
      } else {
        alert("Gagal menghapus E-Wallet");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan.");
    }
  };

  // Derived dummy calculations for rich UI (replace with real backend later)
  const income = summary?.income || 0;
  const expense = summary?.expense || 0;
  
  // Calculate total ewallet balance
  const eWalletTotal = eWallets.reduce((acc, ew) => acc + ew.balance, 0);
  const cashBalance = summary?.balance || 0;
  const balance = cashBalance + eWalletTotal;

  return (
    <div className="finance animate-fade-in pb-12">
      <FinanceHeader 
        period={period} 
        setPeriod={setPeriod} 
        onOpenModal={() => setIsModalOpen(true)} 
      />

      {loading ? (
        <div className="p-8 text-center text-zinc-400 animate-pulse">Memuat insight keuanganmu...</div>
      ) : (
        <>
          <SummaryCards 
            income={income} 
            expense={expense} 
            balance={balance}
            cashBalance={cashBalance}
            eWallets={eWallets}
            onAddEWallet={handleAddEWallet}
            onDeleteEWallet={handleDeleteEWallet}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Left Column: Charts */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              <FinancialSummary 
                income={income} 
                expense={expense} 
                balance={balance} 
                barChartData={trendData} 
              />
              
              <CategoryExpenses 
                categoryData={dynamicCategoryData} 
                expense={expense} 
              />
            </div>

            {/* Right Column: Recent Transactions */}
            <div className="lg:col-span-1">
              <RecentTransactions transactions={recentTransactions} onRefresh={() => fetchData(period)} />
            </div>
          </div>

          <MotivationBanner />
        </>
      )}

      {isModalOpen && (
        <TransactionModal 
          formData={formData as any} 
          setFormData={setFormData as any} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleAddTransaction} 
        />
      )}
    </div>
  );
}
