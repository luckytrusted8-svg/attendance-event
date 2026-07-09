import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import api from '../api/axios';
import PublicNavbar from '../components/PublicNavbar';
import PublicFooter from '../components/PublicFooter';

const phaseLabel = { ongoing: 'Sedang Berlangsung', upcoming: 'Akan Datang', finished: 'Telah Berakhir' };

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTime(timeStr) {
  return new Date(timeStr).toISOString().slice(11, 16);
}
function formatPrice(event) {
  if (!event.isPaid) return 'Gratis';
  return `Rp ${Number(event.price || 0).toLocaleString('id-ID')}`;
}

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [form, setForm] = useState({ fullname: '', email: '', password: '', phone: '', institution: '' });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/events/${id}`).then((res) => setEvent(res.data.data)).catch(() => setError('Event tidak ditemukan.'));
  }, [id]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await api.post(`/events/${id}/registrations`, form);
      setResult(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  }

  if (error && !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500">{error}</p>
      </div>
    );
  }

  if (!event) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">Memuat...</div>;
  }

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location || event.title)}`;
  const isFull = event.capacity ? event.totalRegistrations >= event.capacity : false;
  const agenda = Array.isArray(event.agenda) ? event.agenda : [];

  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />

      {/* Hero banner */}
      <section className="relative h-80 md:h-96 bg-slate-900 overflow-hidden">
        {event.imageUrl && (
          <img src={event.imageUrl} alt={event.title} className="absolute inset-0 w-full h-full object-cover opacity-50" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-slate-900/20" />
        <div className="relative max-w-6xl mx-auto px-6 h-full flex flex-col justify-end pb-10">
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wide">
              {phaseLabel[event.phase] || event.phase}
            </span>
            {event.category && (
              <span className="bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur">
                {event.category}
              </span>
            )}
            <span className="bg-white/10 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur">
              {event.isOnline ? 'Online Event' : 'Onsite Event'}
            </span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${event.isPaid ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
              {formatPrice(event)}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white max-w-2xl leading-tight">
            {event.title}
          </h1>
          <div className="flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm text-slate-200">
            <span>🗓 {formatDate(event.eventDate)}</span>
            <span>🕐 {formatTime(event.startTime)}–{formatTime(event.endTime)}</span>
            <span>📍 {event.isOnline ? (event.location || 'Online') : (event.location || 'Lokasi menyusul')}</span>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-10">
        {/* Left: about + info + agenda */}
        <div className="md:col-span-2 space-y-10">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">Tentang Event</h2>
            <p className="text-slate-600 leading-relaxed whitespace-pre-line">
              {event.description || 'Deskripsi event belum ditambahkan oleh penyelenggara.'}
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">Informasi Event</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'Tanggal', value: formatDate(event.eventDate) },
                { label: 'Waktu', value: `${formatTime(event.startTime)} – ${formatTime(event.endTime)} WIB` },
                { label: event.isOnline ? 'Platform' : 'Lokasi', value: event.location || '-' },
                { label: 'Harga Tiket', value: formatPrice(event) },
                { label: 'Kuota', value: event.capacity ? `${event.totalRegistrations ?? 0} / ${event.capacity} peserta` : `${event.totalRegistrations ?? 0} peserta terdaftar` },
                { label: 'Kategori', value: event.category || '-' },
              ].map((item) => (
                <div key={item.label} className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-xs text-slate-400 font-medium mb-1">{item.label}</p>
                  <p className="text-sm font-semibold text-slate-900">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {agenda.length > 0 && (
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 mb-4">Rundown Acara</h2>
              <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                {agenda.map((row, i) => (
                  <div key={i} className="flex gap-4 p-4">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 shrink-0 w-28">
                      <Clock className="w-3.5 h-3.5" /> {row.time}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                      {row.speaker && <p className="text-xs text-slate-500 mt-0.5">{row.speaker}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: registration form + location card */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-24">
            {result ? (
              <div className="text-center py-2">
                <p className="text-lg font-extrabold text-slate-900 mb-2">Registrasi Berhasil! 🎉</p>
                <p className="text-sm text-slate-500 mb-4">
                  QR Code kehadiran telah dikirim ke email Anda. Simpan hingga hari pelaksanaan event.
                </p>
                <img src={result.qrDataUrl} alt="QR Code" className="w-40 h-40 mx-auto rounded-lg border border-slate-200" />
                <p className="text-xs text-slate-400 mt-3 font-mono">{result.qrCode}</p>
              </div>
            ) : isFull ? (
              <div className="text-center py-6">
                <p className="text-lg font-extrabold text-slate-900 mb-2">Kuota Penuh</p>
                <p className="text-sm text-slate-500">Maaf, jumlah pendaftar untuk event ini sudah mencapai kapasitas maksimal.</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-extrabold tracking-tight text-slate-900">Formulir Registrasi</h2>
                <p className="text-sm text-slate-500 mt-1 mb-1">
                  {event.isPaid ? `Tiket seharga ${formatPrice(event)}.` : 'Amankan kursi Anda untuk event ini — gratis.'}
                </p>
                {event.isPaid && (
                  <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mb-4">
                    Event ini berbayar. Detail pembayaran akan diinformasikan oleh panitia setelah Anda mendaftar.
                  </p>
                )}
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                    <input
                      required
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Masukkan nama lengkap"
                      value={form.fullname}
                      onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                    <input
                      required
                      type="email"
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="nama@email.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                    <input
                      required
                      minLength={6}
                      type="password"
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="••••••••"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                    />
                    <p className="text-xs text-slate-400 mt-1">Minimal 6 karakter.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">No. Telepon (opsional)</label>
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="+62..."
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Institusi (opsional)</label>
                    <input
                      className="w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nama perusahaan/universitas"
                      value={form.institution}
                      onChange={(e) => setForm({ ...form, institution: e.target.value })}
                    />
                  </div>
                  {error && <p className="text-sm text-red-600">{error}</p>}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg text-sm transition-colors"
                  >
                    {submitting ? 'Memproses...' : `Daftar Sekarang${event.isPaid ? '' : ' — Gratis'}`}
                  </button>
                  <p className="text-xs text-slate-400 text-center">
                    QR Code kehadiran akan dikirim ke email Anda setelah registrasi berhasil.
                  </p>
                </form>
              </>
            )}
          </div>

          {!event.isOnline && event.location && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="block bg-white rounded-2xl border border-slate-200 p-5 hover:border-blue-300 transition-colors"
            >
              <p className="text-xs text-slate-400 font-medium mb-1">Lokasi Event</p>
              <p className="text-sm font-semibold text-slate-900 mb-2">{event.location}</p>
              <span className="text-sm text-blue-600 font-medium">Buka di Google Maps →</span>
            </a>
          )}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}