import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Finance from './pages/Finance';
import Logs from './pages/Logs';
import Transaksi from './pages/Transaksi';
import Kategori from './pages/Kategori';
import Riwayat from './pages/Riwayat';
import Tujuan from './pages/Tujuan';
import AuroraBackground from './components/Finance/AuroraBackground';

function App() {
  return (
    <Router>
      <AuroraBackground />
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/finance" element={<Finance />} />
          <Route path="/transaksi" element={<Transaksi />} />
          <Route path="/kategori" element={<Kategori />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="/tujuan" element={<Tujuan />} />
          <Route path="/logs" element={<Logs />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
