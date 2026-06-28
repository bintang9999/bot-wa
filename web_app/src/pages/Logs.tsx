import { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw, AlertCircle, AlertTriangle, Info, Trash2 } from 'lucide-react';

interface LogEntry {
  type: 'log' | 'warn' | 'error';
  time: string;
  message: string;
}

const LOG_CONFIG = {
  log: {
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/20',
    icon: Info,
    label: 'INFO',
    labelColor: 'text-emerald-400',
  },
  warn: {
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
    icon: AlertTriangle,
    label: 'WARN',
    labelColor: 'text-yellow-400',
  },
  error: {
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    icon: AlertCircle,
    label: 'ERR',
    labelColor: 'text-red-400',
  },
};

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<'all' | 'log' | 'warn' | 'error'>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error('Failed to fetch logs', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  // Detect if user manually scrolled up → disable auto-scroll
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(isAtBottom);
  };

  const filteredLogs = filter === 'all' ? logs : logs.filter((l) => l.type === filter);

  const counts = {
    log: logs.filter((l) => l.type === 'log').length,
    warn: logs.filter((l) => l.type === 'warn').length,
    error: logs.filter((l) => l.type === 'error').length,
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  return (
    <div className="flex flex-col gap-6 pb-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-xl font-extrabold text-white tracking-tight">
            <span className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30 border border-indigo-500/30 text-indigo-400">
              <Terminal size={20} />
            </span>
            System Logs
          </h1>
          <p className="text-sm text-zinc-500 mt-1 ml-[52px]">
            Realtime log dari bot — auto-refresh setiap 5 detik
          </p>
        </div>

        <button
          id="btn-refresh-logs"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 hover:text-white font-semibold text-sm transition-all active:scale-95 self-start sm:self-auto"
          onClick={() => { setLoading(true); fetchLogs(); }}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-3">
        {(['log', 'warn', 'error'] as const).map((type) => {
          const cfg = LOG_CONFIG[type];
          const Icon = cfg.icon;
          return (
            <button
              key={type}
              id={`filter-${type}`}
              onClick={() => setFilter(filter === type ? 'all' : type)}
              className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all cursor-pointer active:scale-95 ${
                filter === type
                  ? `${cfg.bgColor} ${cfg.borderColor} ring-1 ring-inset ${cfg.borderColor}`
                  : 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              <Icon size={15} className={cfg.labelColor} />
              <span className={`text-xs font-bold uppercase tracking-wider ${filter === type ? cfg.labelColor : 'text-zinc-500'}`}>
                {type === 'log' ? 'Info' : type === 'warn' ? 'Warning' : 'Error'}
              </span>
              <span className={`ml-auto text-sm font-bold tabular-nums ${filter === type ? cfg.labelColor : 'text-zinc-400'}`}>
                {counts[type]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Terminal */}
      <div
        className="glass-premium rounded-2xl overflow-hidden"
        style={{ minHeight: '60vh' }}
      >
        {/* Terminal top bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-black/20">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/70" />
            <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
            <span className="ml-3 text-xs font-medium text-zinc-500 font-mono">
              bot-wa — logs ({filteredLogs.length} entries)
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!autoScroll && (
              <button
                onClick={() => {
                  setAutoScroll(true);
                  terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                ↓ Scroll ke bawah
              </button>
            )}
            <button
              onClick={() => setFilter('all')}
              className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600 hover:text-zinc-400 transition-colors"
              title="Reset filter"
            >
              <Trash2 size={11} />
              Reset filter
            </button>
          </div>
        </div>

        {/* Log lines */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="overflow-y-auto p-4 space-y-1 font-mono text-[12px] leading-relaxed"
          style={{
            height: 'calc(60vh - 3rem)',
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          }}
        >
          {loading && filteredLogs.length === 0 && (
            <div className="flex items-center gap-3 text-zinc-500 pt-4 pl-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              Memuat logs...
            </div>
          )}

          {!loading && filteredLogs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-3 text-zinc-600">
              <Terminal size={32} />
              <p className="text-sm font-sans">Belum ada log yang tersedia</p>
            </div>
          )}

          {filteredLogs.map((log, idx) => {
            const cfg = LOG_CONFIG[log.type];
            const Icon = cfg.icon;
            return (
              <div
                key={idx}
                className={`group flex gap-3 items-start px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/[0.04]`}
              >
                {/* Timestamp */}
                <span className="text-zinc-600 shrink-0 tabular-nums text-[11px] pt-0.5 min-w-[64px]">
                  {formatTime(log.time)}
                </span>

                {/* Type badge */}
                <span
                  className={`flex items-center gap-1 shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md border ${cfg.bgColor} ${cfg.borderColor} ${cfg.labelColor} min-w-[46px] justify-center`}
                >
                  <Icon size={10} />
                  {cfg.label}
                </span>

                {/* Message */}
                <span className={`break-all ${cfg.color} flex-1`}>
                  {log.message}
                </span>
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>
      </div>
    </div>
  );
}
