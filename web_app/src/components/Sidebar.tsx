import { useState, useEffect, useRef } from 'react';
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
  Contrast,
  CreditCard,
  Terminal,
  MessageCircle,
  ClipboardList,
  Settings,
  X,
  Eye,
  EyeOff,
  ChevronRight,
} from 'lucide-react';

const ALL_MAIN_MENUS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/finance', label: 'Finance', icon: Landmark, end: false },
  { to: '/transaksi', label: 'Transaksi', icon: ReceiptText, end: false },
  { to: '/kategori', label: 'Kategori', icon: Grid2X2, end: false },
  { to: '/riwayat', label: 'Riwayat', icon: History, end: false },
  { to: '/tujuan', label: 'Tujuan', icon: Target, end: false },
  { to: '/cicilan', label: 'Cicilan', icon: CreditCard, end: false },
  { to: '/tugas', label: 'Tugas', icon: ClipboardList, end: false },
];

const ALL_UTIL_MENUS = [
  { to: '/logs', label: 'Logs', icon: Terminal, end: false },
];

const ALL_MENUS = [...ALL_MAIN_MENUS, ...ALL_UTIL_MENUS];
const STORAGE_KEY = 'sidebar_visible_menus';

type Theme = 'dark' | 'oled' | 'light';
const THEME_CYCLE: Theme[] = ['dark', 'oled', 'light'];

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Moon; color: string; desc: string }[] = [
  { value: 'dark', label: 'Dark', icon: Moon, color: 'text-indigo-400', desc: 'Default' },
  { value: 'oled', label: 'OLED', icon: Contrast, color: 'text-violet-400', desc: 'Pure Black' },
  { value: 'light', label: 'Light', icon: Sun, color: 'text-amber-400', desc: 'Terang' },
];

function loadVisibleMenus(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return new Set<string>(parsed);
    }
  } catch {/* ignore */}
  return new Set(ALL_MENUS.map((m) => m.to));
}

function NavItem({ item, visibleMenus }: { item: typeof ALL_MAIN_MENUS[0]; visibleMenus: Set<string> }) {
  if (!visibleMenus.has(item.to)) return null;
  const Icon = item.icon;
  return (
    <NavLink
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
}

function MenuToggleRow({
  item, isVisible, onToggle,
}: {
  item: typeof ALL_MENUS[0]; isVisible: boolean; onToggle: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer ${
        isVisible ? 'bg-indigo-500/10 hover:bg-indigo-500/15' : 'hover:bg-white/[0.03]'
      }`}
    >
      <Icon size={15} className={`shrink-0 transition-colors ${isVisible ? 'text-indigo-400' : 'text-zinc-600'}`} />
      <span className={`flex-1 text-left text-xs font-semibold transition-colors ${isVisible ? 'text-zinc-200' : 'text-zinc-600'}`}>
        {item.label}
      </span>
      <span className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all ${isVisible ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-zinc-600'}`}>
        {isVisible ? <Eye size={12} /> : <EyeOff size={12} />}
      </span>
    </button>
  );
}

/** Theme picker — 3 card chips inline */
function ThemePicker({ theme, onSelect }: { theme: Theme; onSelect: (t: Theme) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {THEME_OPTIONS.map(({ value, label, icon: Icon, color, desc }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            onClick={() => onSelect(value)}
            className={`flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border transition-all duration-200 cursor-pointer ${
              active
                ? 'bg-indigo-500/15 border-indigo-500/40 shadow-[0_0_12px_rgba(99,102,241,0.15)]'
                : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]'
            }`}
          >
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
              active ? 'bg-indigo-500/20' : 'bg-white/[0.04]'
            }`}>
              <Icon size={14} className={active ? color : 'text-zinc-500'} />
            </div>
            <div className="text-center">
              <p className={`text-[10px] font-bold leading-tight transition-colors ${active ? 'text-white' : 'text-zinc-500'}`}>
                {label}
              </p>
              <p className={`text-[9px] leading-tight transition-colors ${active ? 'text-zinc-400' : 'text-zinc-700'}`}>
                {desc}
              </p>
            </div>
            {active && (
              <span className="w-1 h-1 rounded-full bg-indigo-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default function Sidebar() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [botStatus, setBotStatus] = useState<'connected' | 'qr' | 'disconnected'>('disconnected');
  const [showSettings, setShowSettings] = useState(false);
  const [showMobileSettings, setShowMobileSettings] = useState(false);
  const [visibleMenus, setVisibleMenus] = useState<Set<string>>(loadVisibleMenus);
  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null;
    if (saved && THEME_CYCLE.includes(saved)) {
      setTheme(saved);
      if (saved !== 'dark') {
        document.documentElement.setAttribute('data-theme', saved);
      }
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target as Node)) {
        setShowSettings(false);
      }
    };
    if (showSettings) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showSettings]);

  useEffect(() => {
    document.body.style.overflow = showMobileSettings ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileSettings]);

  const applyTheme = (t: Theme) => {
    setTheme(t);
    if (t === 'dark') {
      document.documentElement.removeAttribute('data-theme');
      localStorage.removeItem('theme');
    } else {
      document.documentElement.setAttribute('data-theme', t);
      localStorage.setItem('theme', t);
    }
  };

  const toggleMenuVisibility = (to: string) => {
    setVisibleMenus((prev) => {
      const next = new Set(prev);
      if (next.has(to)) next.delete(to);
      else next.add(to);
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const statusColor = botStatus === 'connected' ? 'bg-emerald-500' : botStatus === 'qr' ? 'bg-yellow-400' : 'bg-zinc-600';
  const statusLabel = botStatus === 'connected' ? 'Online' : botStatus === 'qr' ? 'Scan QR' : 'Offline';
  const statusTextColor = botStatus === 'connected' ? 'text-emerald-400' : botStatus === 'qr' ? 'text-yellow-400' : 'text-zinc-500';

  const visibleMain = ALL_MAIN_MENUS.filter((m) => visibleMenus.has(m.to));
  const visibleUtil = ALL_UTIL_MENUS.filter((m) => visibleMenus.has(m.to));
  const allMenusForMobile = ALL_MENUS.filter((m) => visibleMenus.has(m.to));
  const ActiveThemeIcon = THEME_OPTIONS.find((t) => t.value === theme)?.icon ?? Moon;
  const activeThemeColor = THEME_OPTIONS.find((t) => t.value === theme)?.color ?? 'text-zinc-400';

  return (
    <>
      {/* ── Mobile Settings Bottom Sheet ── */}
      {showMobileSettings && (
        <div className="md:hidden fixed inset-0 z-[100] flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileSettings(false)} />
      <div className="mobile-settings-sheet rounded-t-3xl max-h-[85vh] flex flex-col">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="mobile-settings-handle w-10 h-1 rounded-full" />
            </div>
            {/* Header */}
            <div className="mobile-settings-header flex items-center justify-between px-5 py-3 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-sm font-bold shadow-[0_0_16px_rgba(99,102,241,0.4)]">
                  B
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Bintang</p>
                  <p className="text-[10px] text-zinc-500 font-medium">Owner · Pengaturan</p>
                </div>
              </div>
              <button
                onClick={() => setShowMobileSettings(false)}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-500 hover:text-zinc-200 transition-all cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 px-4 py-4 flex flex-col gap-5">

              {/* ── Tema ── */}
              <div>
                <p className="settings-panel-label text-[10px] font-bold uppercase tracking-widest mb-2.5 px-0.5">Tema Tampilan</p>
                <ThemePicker theme={theme} onSelect={applyTheme} />
              </div>

              {/* ── Menu Utama ── */}
              <div>
                <p className="settings-panel-label text-[10px] font-bold uppercase tracking-widest mb-2 px-0.5">Menu Utama</p>
                <div className="flex flex-col gap-1">
                  {ALL_MAIN_MENUS.map((item) => (
                    <MenuToggleRow
                      key={item.to} item={item}
                      isVisible={visibleMenus.has(item.to)}
                      onToggle={() => toggleMenuVisibility(item.to)}
                    />
                  ))}
                </div>
              </div>

              {/* ── Utilitas ── */}
              <div className="pt-1 settings-panel-divider border-t">
                <p className="settings-panel-label text-[10px] font-bold uppercase tracking-widest mb-2 px-0.5 pt-3">Utilitas</p>
                <div className="flex flex-col gap-1">
                  {ALL_UTIL_MENUS.map((item) => (
                    <MenuToggleRow
                      key={item.to} item={item}
                      isVisible={visibleMenus.has(item.to)}
                      onToggle={() => toggleMenuVisibility(item.to)}
                    />
                  ))}
                </div>
              </div>

              <div className="h-2" />
            </div>
          </div>
        </div>
      )}

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
                <h1 className="text-sm font-extrabold leading-tight text-white tracking-tight truncate">NAS Finance</h1>
                <p className="text-[11px] font-medium text-zinc-500 truncate">Dashboard Keuangan</p>
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

            {/* Nav label */}
            <div className="px-3">
              <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Menu</span>
            </div>

            {/* Nav links */}
            <nav className="flex flex-col gap-1 px-2">
              {visibleMain.map((item) => (
                <NavItem key={item.to} item={item} visibleMenus={visibleMenus} />
              ))}
            </nav>

            {/* Utility Section */}
            {visibleUtil.length > 0 && (
              <>
                <div className="px-3 mt-2">
                  <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-1">Utilitas</span>
                </div>
                <nav className="flex flex-col gap-1 px-2">
                  {visibleUtil.map((item) => (
                    <NavItem key={item.to} item={item} visibleMenus={visibleMenus} />
                  ))}
                </nav>
              </>
            )}
          </div>

          {/* ── Bottom ── */}
          <div className="flex flex-col gap-2 px-2 pb-2" ref={settingsRef}>

            {/* Settings Panel */}
                        {showSettings && (
              <div className="settings-panel rounded-2xl overflow-hidden mb-1">

                {/* Panel Header */}
                <div className="flex items-center justify-between px-4 py-3 settings-panel-divider border-b">
                  <div>
                    <p className="text-xs font-bold">Pengaturan</p>
                    <p className="settings-panel-label text-[10px] mt-0.5">Tema & visibilitas menu</p>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="settings-panel-close w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                  >
                    <X size={11} />
                  </button>
                </div>

                <div className="px-3 py-3 flex flex-col gap-3.5">

                  {/* ── Tema ── */}
                  <div>
                    <p className="settings-panel-label text-[9px] font-bold uppercase tracking-widest mb-2 px-0.5">Tema Tampilan</p>
                    <ThemePicker theme={theme} onSelect={applyTheme} />
                  </div>

                  {/* ── Menu Utama ── */}
                  <div className="pt-2 settings-panel-divider border-t">
                    <p className="settings-panel-label text-[9px] font-bold uppercase tracking-widest mb-1.5 px-0.5">Menu Utama</p>
                    <div className="flex flex-col gap-0.5">
                      {ALL_MAIN_MENUS.map((item) => (
                        <MenuToggleRow
                          key={item.to} item={item}
                          isVisible={visibleMenus.has(item.to)}
                          onToggle={() => toggleMenuVisibility(item.to)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* ── Utilitas ── */}
                  <div className="pt-2 settings-panel-divider border-t">
                    <p className="settings-panel-label text-[9px] font-bold uppercase tracking-widest mb-1.5 px-0.5">Utilitas</p>
                    <div className="flex flex-col gap-0.5">
                      {ALL_UTIL_MENUS.map((item) => (
                        <MenuToggleRow
                          key={item.to} item={item}
                          isVisible={visibleMenus.has(item.to)}
                          onToggle={() => toggleMenuVisibility(item.to)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Personal Avatar + Settings trigger */}
            <button
              id="settings-trigger"
              onClick={() => setShowSettings((v) => !v)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 w-full group cursor-pointer ${
                showSettings
                  ? 'bg-indigo-500/10 border-indigo-500/30'
                  : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.05] hover:border-white/[0.08]'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-[0_0_12px_rgba(99,102,241,0.3)] flex-shrink-0">
                B
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[11px] font-bold text-zinc-300 truncate">Bintang</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ActiveThemeIcon size={9} className={`flex-shrink-0 ${activeThemeColor}`} />
                  <p className="text-[9px] font-medium text-zinc-600 truncate capitalize">{theme} mode</p>
                </div>
              </div>
              <div className={`flex items-center gap-1 transition-colors ${showSettings ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400'}`}>
                <Settings size={13} className={`transition-transform duration-300 ${showSettings ? 'rotate-90' : ''}`} />
                <ChevronRight size={11} className={`transition-transform duration-200 ${showSettings ? '-rotate-90' : ''}`} />
              </div>
            </button>
          </div>
        </div>

        {/* ── MOBILE BOTTOM NAV ── */}
        <nav className="md:hidden flex h-full w-full items-center justify-around px-2">
          {allMenusForMobile.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                id={`mobile-nav-${item.label.toLowerCase()}`}
                title={item.label}
                className={({ isActive }) =>
                  ['flex items-center justify-center flex-1 h-full transition-all duration-200',
                    isActive ? 'text-indigo-400' : 'text-zinc-500 active:scale-95'].join(' ')
                }
              >
                {({ isActive }) => (
                  <span className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-200 ${
                    isActive ? 'bg-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.25)]' : 'hover:bg-white/5'
                  }`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </span>
                )}
              </NavLink>
            );
          })}

          {/* Settings icon in nav */}
          <button
            id="mobile-nav-settings"
            title="Pengaturan"
            onClick={() => setShowMobileSettings(true)}
            className="flex items-center justify-center flex-1 h-full text-zinc-500 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            <span className="flex items-center justify-center w-10 h-10 rounded-2xl hover:bg-white/5 transition-all duration-200">
              <Settings size={20} strokeWidth={1.8} />
            </span>
          </button>
        </nav>
      </aside>
    </>
  );
}