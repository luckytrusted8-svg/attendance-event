import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';

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
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <p className="text-ink-700/60">{error}</p>
      </div>
    );
  }

  if (!event) {
    return <div className="min-h-screen flex items-center justify-center bg-brand-50 text-ink-700/50">Memuat...</div>;
  }

  return (
    <div className="min-h-screen bg-brand-50">
      <header className="bg-ink-950 text-white px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="font-display text-lg">← Event & Kehadiran Digital</Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10 grid md:grid-cols-2 gap-8">
        <div>
          <div className="h-48 bg-white rounded-lg border border-ink-700/10 overflow-hidden mb-4 flex items-center justify-center">
            {event.imageUrl ? (
              <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
            ) : (
              <span className="font-display text-4xl text-ink-700/20">Ev</span>
            )}
          </div>
          <h1 className="font-display text-2xl text-ink-900 mb-2">{event.title}</h1>
          <p className="text-sm text-ink-700/60 mb-4">{event.location}</p>
          <p className="text-sm text-ink-800 whitespace-pre-line">{event.description}</p>
        </div>

        <div className="card p-6 h-fit">
          {result ? (
            <div className="text-center py-4">
              <p className="font-display text-lg text-ink-900 mb-2">Registrasi Berhasil!</p>
              <p className="text-sm text-ink-700/60 mb-4">
                QR Code kehadiran telah dikirim ke email Anda. Simpan email tersebut hingga hari pelaksanaan event.
              </p>
              <img src={result.qrDataUrl} alt="QR Code" className="w-40 h-40 mx-auto rounded-md border border-ink-700/10" />
              <p className="text-xs text-ink-700/40 mt-3 font-mono">{result.qrCode}</p>
            </div>
          ) : (
            <>
              <h2 className="font-display text-lg text-ink-900 mb-4">Formulir Registrasi</h2>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <label className="label-field">Nama Lengkap</label>
                  <input
                    required
                    className="input-field"
                    value={form.fullname}
                    onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-field">Email</label>
                  <input
                    required
                    type="email"
                    className="input-field"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-field">Password</label>
                  <input
                    required
                    minLength={6}
                    type="password"
                    className="input-field"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <p className="text-xs text-ink-700/40 mt-1">Minimal 6 karakter.</p>
                </div>
                <div>
                  <label className="label-field">No. Telepon (opsional)</label>
                  <input
                    className="input-field"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label-field">Institusi (opsional)</label>
                  <input
                    className="input-field"
                    value={form.institution}
                    onChange={(e) => setForm({ ...form, institution: e.target.value })}
                  />
                </div>
                {error && <p className="text-sm text-danger">{error}</p>}
                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? 'Memproses...' : 'Daftar Sekarang'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
