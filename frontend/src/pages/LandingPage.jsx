import { useEffect, useState } from 'react';
import api from '../api/axios';
import EventCard from '../components/EventCard';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const SECTIONS = [
  {
    id: 'ongoing',
    phase: 'ongoing',
    title: 'Sedang Berlangsung',
    subtitle: 'Event yang sedang berjalan hari ini — langsung datang atau daftar di tempat.',
    limit: 3,
  },
  {
    id: 'upcoming',
    phase: 'upcoming',
    title: 'Akan Datang',
    subtitle: 'Catat jadwalnya dan amankan kursi Anda lebih awal.',
    limit: 4,
  },
  {
    id: 'finished',
    phase: 'finished',
    title: 'Event Selesai',
    subtitle: 'Arsip event yang telah terlaksana.',
    limit: 3,
  },
];

export default function LandingPage() {
  const [events, setEvents] = useState([]);
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
    const interval = setInterval(fetchEvents, 8000); // polling real-time (PRD 8.2)
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const byPhase = (phase) => events.filter((e) => e.phase === phase);

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
            Registrasi & Verifikasi Kehadiran Digital
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 max-w-2xl leading-tight">
            Daftar event favorit Anda, hadir cukup dengan satu pindai QR Code.
          </h1>
          <p className="text-slate-500 max-w-xl mt-5 leading-relaxed">
            Temukan seminar, workshop, dan konferensi yang sedang berlangsung, akan datang, maupun yang sudah
            terlaksana  semuanya dalam satu tempat.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 mt-8">
            <a href="#ongoing" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-full text-sm text-center transition-colors">
              Jelajahi Event →
            </a>
            <a href="#finished" className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-6 py-3 rounded-full text-sm text-center transition-colors">
              Lihat Arsip Event
            </a>
          </div>

          <div className="mt-10 max-w-md">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari event berdasarkan judul atau lokasi..."
              className="w-full border border-slate-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </section>

      {loading ? (
        <p className="text-center text-sm text-slate-400 py-16">Memuat data event...</p>
      ) : (
        <div className="max-w-6xl mx-auto px-6 py-14 space-y-16">
          {SECTIONS.map((section) => {
            const list = byPhase(section.phase).slice(0, section.limit);
            return (
              <section key={section.id} id={section.id} className="scroll-mt-20">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">{section.title}</h2>
                    <p className="text-sm text-slate-500 mt-1">{section.subtitle}</p>
                  </div>
                </div>

                {list.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
                    <p className="text-sm text-slate-400">Belum ada event pada kategori ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {list.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <PublicFooter />
    </div>
  );
}