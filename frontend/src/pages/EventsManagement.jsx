import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const emptyForm = { title: '', description: '', location: '', eventDate: '', startTime: '', endTime: '', imageUrl: '' };

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [qrModal, setQrModal] = useState(null);

  async function fetchEvents() {
    const res = await api.get('/events');
    setEvents(res.data.data);
  }

  useEffect(() => {
    fetchEvents();
  }, []);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/events', form);
      setForm(emptyForm);
      setShowForm(false);
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat event.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(event, status) {
    await api.patch(`/events/${event.id}/status`, { status });
    fetchEvents();
  }

  async function showQr(event) {
    const res = await api.get(`/events/${event.id}/qr`);
    setQrModal({ event, ...res.data.data });
  }

  return (
    <DashboardLayout title="Kelola Event" subtitle="Buat, publikasikan, dan pantau event Anda.">
      <div className="flex justify-end mb-5">
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Buat Event Baru</button>
      </div>

      <div className="grid gap-4">
        {events.map((e) => (
          <div key={e.id} className="card p-5 flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-display text-lg text-ink-900">{e.title}</h3>
                <span className={`badge ${
                  e.status === 'published' ? 'bg-success/10 text-success'
                  : e.status === 'closed' ? 'bg-danger/10 text-danger'
                  : 'bg-ink-700/10 text-ink-700/60'
                }`}>{e.status}</span>
              </div>
              <p className="text-sm text-ink-700/60">{e.location} · {new Date(e.eventDate).toLocaleDateString('id-ID')}</p>
              <p className="text-xs text-ink-700/40 mt-1">{e.totalRegistrations} pendaftar</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/admin/events/${e.id}/participants`} className="btn-secondary text-sm">Data Peserta</Link>
              <button onClick={() => showQr(e)} className="btn-secondary text-sm">QR Event</button>
              {e.status !== 'published' ? (
                <button onClick={() => toggleStatus(e, 'published')} className="btn-accent text-sm">Publish</button>
              ) : (
                <button onClick={() => toggleStatus(e, 'closed')} className="btn-secondary text-sm">Tutup</button>
              )}
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="card p-10 text-center text-ink-700/40">Belum ada event. Buat event pertama Anda.</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ink-950/50 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg text-ink-900 mb-4">Buat Event Baru</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="label-field">Judul Event</label>
                <input required className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Deskripsi</label>
                <textarea className="input-field" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Lokasi</label>
                <input className="input-field" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label-field">Tanggal</label>
                  <input required type="date" className="input-field" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
                </div>
                <div>
                  <label className="label-field">Jam Mulai</label>
                  <input required type="time" className="input-field" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                </div>
                <div>
                  <label className="label-field">Jam Selesai</label>
                  <input required type="time" className="input-field" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label-field">Foto Event (opsional)</label>
                <input type="file" accept="image/*" onChange={handleImage} className="text-sm" />
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Menyimpan...' : 'Simpan sebagai Draft'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 bg-ink-950/50 flex items-center justify-center z-50 px-4" onClick={() => setQrModal(null)}>
          <div className="card w-full max-w-xs p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg text-ink-900 mb-1">{qrModal.event.title}</h2>
            <p className="text-xs text-ink-700/50 mb-4">QR Code tautan registrasi event</p>
            <img src={qrModal.qrCode} alt="QR Event" className="w-48 h-48 mx-auto rounded-md border border-ink-700/10 mb-3" />
            <a href={qrModal.qrCode} download={`qr-event-${qrModal.event.id}.png`} className="btn-primary w-full block">Unduh QR Code</a>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
