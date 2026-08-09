import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Logs from './pages/Logs';
import Transaksi from './pages/Transaksi';
import Kategori from './pages/Kategori';
import Riwayat from './pages/Riwayat';
import Tujuan from './pages/Tujuan';
import Cicilan from './pages/Cicilan';
import Tugas from './pages/Tugas';
import AuroraBackground from './components/Finance/AuroraBackground';
import InstallPrompt from './components/InstallPrompt';

function App() {
  return (
    <Router>
      <AuroraBackground />
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
      <InstallPrompt />
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/transaksi" element={<Transaksi />} />
          <Route path="/kategori" element={<Kategori />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="/tujuan" element={<Tujuan />} />
          <Route path="/cicilan" element={<Cicilan />} />
          <Route path="/tugas" element={<Tugas />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
