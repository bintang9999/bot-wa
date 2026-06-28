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
  Sun,
  CreditCard,
  Terminal,
  MessageCircle,
  ClipboardList,
} from 'lucide-react';

const menus = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/finance', label: 'Finance', icon: Landmark, end: false },
  { to: '/transaksi', label: 'Transaksi', icon: ReceiptText, end: false },
  { to: '/kategori', label: 'Kategori', icon: Grid2X2, end: false },
  { to: '/riwayat', label: 'Riwayat', icon: History, end: false },
  { to: '/tujuan', label: 'Tujuan', icon: Target, end: false },
  { to: '/cicilan', label: 'Cicilan', icon: CreditCard, end: false },
  { to: '/tugas', label: 'Tugas', icon: ClipboardList, end: false },
  { to: '/logs', label: 'Logs', icon: Terminal, end: false },
];

export default function Sidebar() {
  const [isOled, setIsOled] = useState(false);
  const [botStatus, setBotStatus] = useState<'connected' | 'qr' | 'disconnected'>('disconnected');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'oled') {
      setIsOled(true);
      document.documentElement.setAttribute('data-theme', 'oled');
    }
  }, []);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/bot/status');
        const data = await res.json();
        setBotStatus(data.status);
      } catch {
        setBotStatus('disconnected');
      }
    };
    fetchStatus();
    const iv = setInterval(fetchStatus, 8000);
    return () => clearInterval(iv);
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

  const statusColor =
    botStatus === 'connected'
      ? 'bg-emerald-500'
      : botStatus === 'qr'
      ? 'bg-yellow-400'
      : 'bg-zinc-600';
  const statusLabel =
    botStatus === 'connected' ? 'Online' : botStatus === 'qr' ? 'Scan QR' : 'Offline';
  const statusTextColor =
    botStatus === 'connected'
      ? 'text-emerald-400'
      : botStatus === 'qr'
      ? 'text-yellow-400'
      : 'text-zinc-500';

  return (
    <>
      {/* ── Mobile: floating theme button top-right ── */}
      <button
        id="mobile-theme-toggle"
        onClick={toggleTheme}
        aria-label="Toggle OLED mode"
        className="md:hidden fixed top-3 right-3 z-50 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all shadow-lg active:scale-95"
      >
        {isOled ? <Sun size={16} className="text-indigo-400" /> : <Moon size={16} />}
      </button>

      <aside className="app-sidebar">
        {/* ── DESKTOP SIDEBAR ── */}
        <div className="hidden md:flex h-full flex-col justify-between py-2">
          {/* Logo */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3 px-3 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 shadow-[0_0_24px_rgba(99,102,241,0.45)] flex-shrink-0">
                <Wallet size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-extrabold leading-tight text-white tracking-tight truncate">
                  Keuanganku
                </h1>
                <p className="text-[11px] font-medium text-zinc-500 truncate">Kelola Keuangan</p>
              </div>
            </div>

            {/* Status Bot */}
            <div className="mx-3 flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <MessageCircle size={13} className="text-zinc-500 flex-shrink-0" />
              <span className="text-[11px] text-zinc-500 font-medium flex-1">Bot WhatsApp</span>
              <span className={`flex items-center gap-1.5 text-[11px] font-bold ${statusTextColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusColor} ${botStatus === 'connected' ? 'animate-pulse' : ''}`} />
                {statusLabel}
              </span>
            </div>

            {/* Nav divider label */}
            <div className="px-3">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Menu</span>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-1 px-2">
              {menus.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    id={`nav-${item.label.toLowerCase()}`}
                    className={({ isActive }) =>
                      [
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                        isActive
                          ? 'bg-gradient-to-r from-indigo-500/25 to-violet-500/15 text-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.4)]'
                          : 'text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200',
                      ].join(' ')
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={`absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full transition-all duration-300 ${
                            isActive ? 'bg-indigo-400 opacity-100' : 'opacity-0'
                          }`}
                        />
                        <Icon
                          size={18}
                          className={`shrink-0 transition-all duration-200 ${
                            isActive ? 'text-indigo-300' : 'group-hover:scale-110 group-hover:text-zinc-200'
                          }`}
                        />
                        <span className="font-medium">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Bottom */}
          <div className="flex flex-col gap-3 px-2 pb-2">
            <button
              id="desktop-theme-toggle"
              onClick={toggleTheme}
              className="flex items-center gap-2 py-2.5 px-3 rounded-xl bg-black/40 border border-white/[0.06] hover:bg-black/60 hover:border-white/10 text-zinc-400 hover:text-white transition-all w-full group cursor-pointer"
            >
              {isOled ? (
                <Sun size={15} className="text-indigo-400 flex-shrink-0" />
              ) : (
                <Moon size={15} className="text-zinc-400 group-hover:text-white flex-shrink-0 transition-colors" />
              )}
              <span className="text-xs font-bold tracking-wide">
                {isOled ? 'Matikan OLED' : 'Mode OLED'}
              </span>
            </button>

            <p className="text-center text-[10px] font-medium text-zinc-700">
              © 2026 Bintang Ramadhani
            </p>
          </div>
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="md:hidden flex h-full w-full items-center justify-around px-2">
          {menus.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                id={`mobile-nav-${item.label.toLowerCase()}`}
                title={item.label}
                className={({ isActive }) =>
                  [
                    'flex items-center justify-center flex-1 h-full transition-all duration-200',
                    isActive ? 'text-indigo-400' : 'text-zinc-500 active:scale-95',
                  ].join(' ')
                }
              >
                {({ isActive }) => (
                  <span
                    className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 ${
                      isActive ? 'bg-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.25)]' : 'hover:bg-white/5'
                    }`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
}