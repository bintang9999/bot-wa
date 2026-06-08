import { useState, useEffect, useRef } from 'react';
import { Terminal, RefreshCw } from 'lucide-react';

interface LogEntry {
  type: 'log' | 'warn' | 'error';
  time: string;
  message: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/logs');
      const data = await res.json();
      setLogs(data);
    } catch (error) {
      console.error("Failed to fetch logs", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Refresh logs every 5 seconds
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Auto scroll to bottom
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  return (
    <div className="logs-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="flex items-center gap-3">
          <Terminal size={32} color="var(--accent-blue)" />
          System Logs
        </h1>
        <button className="btn-primary" onClick={fetchLogs} disabled={loading}>
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="terminal">
        {logs.length === 0 && !loading && (
          <div className="text-secondary text-center mt-10">No logs available yet...</div>
        )}
        {logs.map((log, idx) => (
          <div key={idx} className={`terminal-line ${log.type === 'error' ? 'terminal-error' : ''}`}>
            <span style={{ color: '#6b7280', marginRight: '10px' }}>
              [{new Date(log.time).toLocaleTimeString('en-US', { hour12: false })}]
            </span>
            <span style={{ color: log.type === 'warn' ? '#f59e0b' : 'inherit' }}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
}
