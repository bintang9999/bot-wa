import { useEffect, useState } from 'react';

export default function AuroraBackground() {
  const [balanceStatus, setBalanceStatus] = useState<'positive' | 'negative' | 'neutral'>('neutral');

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await fetch('/api/finance/balance');
        const data = await res.json();
        if (data && data.balance !== undefined) {
          // positive if income is at least 1.2x expense and balance > 0
          if (data.balance > 0 && data.income > data.expense * 1.2) {
            setBalanceStatus('positive');
          } else if (data.expense > data.income) {
            setBalanceStatus('negative');
          } else {
            setBalanceStatus('neutral');
          }
        }
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchBalance();
    // Refresh background every 30s
    const interval = setInterval(fetchBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  let color1 = 'bg-indigo-600/20';
  let color2 = 'bg-purple-600/20';

  if (balanceStatus === 'positive') {
    color1 = 'bg-emerald-600/20';
    color2 = 'bg-teal-600/20';
  } else if (balanceStatus === 'negative') {
    color1 = 'bg-red-600/20';
    color2 = 'bg-rose-600/20';
  }

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 transition-colors duration-1000">
      <div 
        className={`absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full blur-[120px] ${color1} animate-pulse transition-colors duration-[3000ms]`} 
        style={{ animationDuration: '8s' }}
      ></div>
      <div 
        className={`absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vw] max-w-[900px] max-h-[900px] rounded-full blur-[150px] ${color2} animate-pulse transition-colors duration-[3000ms]`} 
        style={{ animationDuration: '12s', animationDelay: '2s' }}
      ></div>
    </div>
  );
}
