import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import EventCard from '../components/EventCard';

const TABS = [
  { key: 'ongoing', label: 'Sedang Berlangsung' },
  { key: 'upcoming', label: 'Akan Datang' },
  { key: 'finished', label: 'Telah Berakhir' },
];

export default function LandingPage() {
  const [events, setEvents] = useState([]);
  const [tab, setTab] = useState('ongoing');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  async function fetchEvents() {
    try {
      const res = await api.get('/events', { params: { search } });
      setEvents(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 8000);
    return () => clearInterval(interval);
  }, [search]);

  const filtered = events.filter((e) => e.phase === tab);

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="bg-ink-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div>
            <p className="font-display text-xl">Event & Kehadiran Digital</p>
            <p className="text-xs text-white/40 mt-0.5">Registrasi event & verifikasi kehadiran berbasis QR Code</p>
          </div>
          <Link to="/admin/login" className="btn-secondary bg-white/5 border-white/10 text-white hover:bg-white/10">
            Login Admin
          </Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === t.key ? 'bg-brand-600 text-white' : 'bg-white text-ink-700/70 border border-ink-700/10'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari event berdasarkan judul/lokasi..."
            className="input-field md:w-72"
          />
        </div>

        {loading ? (
          <p className="text-sm text-ink-700/50">Memuat data event...</p>
        ) : filtered.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="font-display text-lg text-ink-900 mb-1">Belum ada event</p>
            <p className="text-sm text-ink-700/60">Tidak ada event pada kategori ini saat ini.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
