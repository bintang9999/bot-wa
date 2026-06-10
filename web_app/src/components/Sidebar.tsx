import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ReceiptText,
  Grid2X2,
  Target,
  Wallet,
  History,
  Landmark,
  Moon,
  CreditCard
} from 'lucide-react';

const menus = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/finance',
    label: 'Finance',
    icon: Landmark,
  },
  {
    to: '/transaksi',
    label: 'Transaksi',
    icon: ReceiptText,
  },
  {
    to: '/kategori',
    label: 'Kategori',
    icon: Grid2X2,
  },
  {
    to: '/riwayat',
    label: 'Riwayat',
    icon: History,
  },
  {
    to: '/tujuan',
    label: 'Tujuan',
    icon: Target,
  },
  {
    to: '/cicilan',
    label: 'Cicilan',
    icon: CreditCard,
  },
];

export default function Sidebar() {
  const [isOled, setIsOled] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'oled') {
      setIsOled(true);
      document.documentElement.setAttribute('data-theme', 'oled');
    }
  }, []);

  const toggleTheme = () => {
    if (isOled) {
      setIsOled(false);
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      setIsOled(true);
      document.documentElement.setAttribute('data-theme', 'oled');
      localStorage.setItem('theme', 'oled');
    }
  };

  return (
    <>
      {/* Mobile Floating Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className="md:hidden fixed top-4 right-4 z-50 w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-lg"
      >
        <Moon size={18} className={isOled ? "text-indigo-400 fill-indigo-400" : ""} />
      </button>

      <aside className="app-sidebar">
        <div className="flex h-full flex-col justify-between">
        <div className="flex flex-col gap-8">
          <div className="hidden md:flex items-center gap-4 px-3 py-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-[0_0_30px_rgba(99,102,241,0.5)] flex-shrink-0">
              <Wallet size={24} className="text-white" />
            </div>

            <div>
              <h1 className="text-base font-extrabold leading-tight text-white">
                Keuanganku
              </h1>
              <p className="text-xs font-medium text-zinc-500">
                Kelola Keuangan
              </p>
            </div>
          </div>

          <nav className="flex h-full w-full items-center justify-around gap-1 px-2 md:h-auto md:flex-col md:items-stretch md:justify-start md:px-0 md:gap-2">
            {menus.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    [
                      'group relative flex items-center justify-center gap-3 rounded-xl px-3 py-3 text-xs md:text-sm font-semibold transition-all duration-200 md:justify-start md:px-4 md:py-3',
                      isActive
                        ? 'bg-gradient-to-r from-indigo-500/30 to-violet-500/20 text-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.5)] md:shadow-[inset_2px_0_0_rgba(99,102,241,1)] md:border-l-2 md:border-l-indigo-500'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-all',
                    ].join(' ')
                  }
                >
                  <Icon
                    size={20}
                    className="shrink-0 transition-transform group-hover:scale-110"
                  />

                  <span className="hidden md:inline font-medium">
                    {item.label}
                  </span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        <div className="hidden md:flex flex-col gap-5 px-3 pb-4">
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-black/40 border border-white/5 hover:bg-black hover:border-white/10 text-zinc-400 hover:text-white transition-all w-full group cursor-pointer"
          >
            <Moon size={16} className={`transition-all ${isOled ? "text-indigo-400 fill-indigo-400" : "text-zinc-400 group-hover:text-white"}`} />
            <span className="text-xs font-bold tracking-wide">{isOled ? "MATIKAN OLED" : "MODE OLED"}</span>
          </button>

          <p className="text-center text-[10px] font-medium text-zinc-600">
            © 2026 Bintang Ramadhani
          </p>
        </div>
      </div>
    </aside>
    </>
  );
}