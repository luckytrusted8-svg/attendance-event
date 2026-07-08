import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const emptyForm = { title: '', description: '', location: '', eventDate: '', startTime: '', endTime: '', imageUrl: '' };

export default function EventsManagement() {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [qrModal, setQrModal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('latest');
  const [statistics, setStatistics] = useState({
    total: 0,
    active: 0,
    coming: 0,
    completed: 0
  });

  // Ambil data event dari backend
  async function fetchEvents() {
    try {
      const res = await api.get('/events');
      const eventData = res.data.data || [];
      setEvents(eventData);
      applyFilters(eventData, searchTerm, statusFilter, sortFilter);
      updateStatistics(eventData);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Gagal mengambil data event');
    }
  }

  // Update statistik berdasarkan data event
  function updateStatistics(eventData) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const stats = {
      total: eventData.length,
      active: 0,
      coming: 0,
      completed: 0
    };

    eventData.forEach(event => {
      const eventDate = new Date(event.eventDate);
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      // Event aktif (published dan tanggal event >= hari ini)
      if (event.status === 'published' && eventDateOnly >= today) {
        stats.active++;
      }
      
      // Event coming (draft atau belum dipublish)
      if (event.status === 'draft' && eventDateOnly >= today) {
        stats.coming++;
      }
      
      // Event selesai (closed atau tanggal event < hari ini)
      if (event.status === 'closed' || (event.status === 'published' && eventDateOnly < today)) {
        stats.completed++;
      }
    });

    setStatistics(stats);
  }

  // Apply filters ke data event
  function applyFilters(data, search, status, sort) {
    let filtered = [...data];

    // Search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter(event => 
        event.title?.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower) ||
        event.location?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (status !== 'all') {
      filtered = filtered.filter(event => event.status === status);
    }

    // Sort filter
    switch(sort) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
        break;
      case 'a-z':
        filtered.sort((a, b) => a.title?.localeCompare(b.title));
        break;
      case 'z-a':
        filtered.sort((a, b) => b.title?.localeCompare(a.title));
        break;
      case 'most-registrants':
        filtered.sort((a, b) => (b.totalRegistrations || 0) - (a.totalRegistrations || 0));
        break;
      default:
        break;
    }

    setFilteredEvents(filtered);
  }

  // Handle filter changes
  useEffect(() => {
    applyFilters(events, searchTerm, statusFilter, sortFilter);
  }, [searchTerm, statusFilter, sortFilter, events]);

  // Initial fetch
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
      await fetchEvents(); // Refresh data setelah create
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat event.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(event, status) {
    try {
      await api.patch(`/events/${event.id}/status`, { status });
      await fetchEvents(); // Refresh data setelah update status
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Gagal mengupdate status event');
    }
  }

  async function showQr(event) {
    try {
      const res = await api.get(`/events/${event.id}/qr`);
      setQrModal({ event, ...res.data.data });
    } catch (err) {
      console.error('Error fetching QR:', err);
      setError('Gagal mengambil QR code');
    }
  }

  // Reset filters
  function resetFilters() {
    setSearchTerm('');
    setStatusFilter('all');
    setSortFilter('latest');
  }

  // Helper function untuk format tanggal
  function formatDate(dateString) {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  }

  // Get status badge class
  function getStatusBadgeClass(status) {
    switch(status) {
      case 'published':
        return 'bg-success/10 text-success';
      case 'closed':
        return 'bg-danger/10 text-danger';
      case 'draft':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-ink-700/10 text-ink-700/60';
    }
  }

  // Get status label
  function getStatusLabel(status) {
    switch(status) {
      case 'published':
        return 'Dipublikasikan';
      case 'closed':
        return 'Ditutup';
      case 'draft':
        return 'Draft';
      default:
        return status || 'Tidak diketahui';
    }
  }

  return (
    <DashboardLayout title="Kelola Event" subtitle="Buat, publikasikan, dan pantau event Anda.">
      {/* Statistik Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-sm text-ink-700/60">Total Event</p>
          <p className="text-2xl font-display text-ink-900">{statistics.total}</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-success">
          <p className="text-sm text-ink-700/60">Aktif</p>
          <p className="text-2xl font-display text-success">{statistics.active}</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-warning">
          <p className="text-sm text-ink-700/60">Coming Soon</p>
          <p className="text-2xl font-display text-warning">{statistics.coming}</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-danger">
          <p className="text-sm text-ink-700/60">Selesai</p>
          <p className="text-2xl font-display text-danger">{statistics.completed}</p>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="🔍 Cari Event..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40">🔍</span>
        </div>
        
        <select
          className="input-field md:w-48"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">📋 Semua Status</option>
          <option value="draft">📝 Draft</option>
          <option value="published">✅ Dipublikasikan</option>
          <option value="closed">🔒 Ditutup</option>
        </select>

        <select
          className="input-field md:w-48"
          value={sortFilter}
          onChange={(e) => setSortFilter(e.target.value)}
        >
          <option value="latest">🕐 Terbaru</option>
          <option value="oldest">🕐 Terlama</option>
          <option value="a-z">🔤 A-Z</option>
          <option value="z-a">🔤 Z-A</option>
          <option value="most-registrants">👥 Pendaftar Terbanyak</option>
        </select>

        {(searchTerm || statusFilter !== 'all' || sortFilter !== 'latest') && (
          <button 
            onClick={resetFilters}
            className="btn-secondary whitespace-nowrap"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Create Event Button */}
      <div className="flex justify-end mb-5">
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Buat Event Baru</button>
      </div>

      {/* Events List */}
      <div className="grid gap-4">
        {filteredEvents.length > 0 ? (
          filteredEvents.map((e) => (
            <div key={e.id} className="card p-5 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-md transition-shadow">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h3 className="font-display text-lg text-ink-900">{e.title}</h3>
                  <span className={`badge ${getStatusBadgeClass(e.status)}`}>
                    {getStatusLabel(e.status)}
                  </span>
                </div>
                <p className="text-sm text-ink-700/60">
                  📍 {e.location || 'Lokasi tidak ditentukan'} · 
                  📅 {formatDate(e.eventDate)}
                  {e.startTime && ` · ⏰ ${e.startTime.substring(0, 5)}`}
                  {e.endTime && ` - ${e.endTime.substring(0, 5)}`}
                </p>
                <p className="text-xs text-ink-700/40 mt-1">
                  👥 {e.totalRegistrations || 0} pendaftar
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link to={`/admin/events/${e.id}/participants`} className="btn-secondary text-sm">
                  Data Peserta
                </Link>
                <button onClick={() => showQr(e)} className="btn-secondary text-sm">
                  QR Event
                </button>
                {e.status !== 'published' ? (
                  <button 
                    onClick={() => toggleStatus(e, 'published')} 
                    className="btn-accent text-sm"
                  >
                    Publish
                  </button>
                ) : (
                  <button 
                    onClick={() => toggleStatus(e, 'closed')} 
                    className="btn-secondary text-sm"
                  >
                    Tutup
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="card p-10 text-center text-ink-700/40">
            {searchTerm || statusFilter !== 'all' ? 
              'Tidak ada event yang sesuai dengan filter yang dipilih.' : 
              'Belum ada event. Buat event pertama Anda.'
            }
          </div>
        )}
      </div>

      {/* Create Event Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-ink-950/50 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-display text-lg text-ink-900 mb-4">Buat Event Baru</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="label-field">Judul Event *</label>
                <input 
                  required 
                  className="input-field" 
                  value={form.title} 
                  onChange={(e) => setForm({ ...form, title: e.target.value })} 
                  placeholder="Masukkan judul event"
                />
              </div>
              <div>
                <label className="label-field">Deskripsi</label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  value={form.description} 
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi event"
                />
              </div>
              <div>
                <label className="label-field">Lokasi</label>
                <input 
                  className="input-field" 
                  value={form.location} 
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="Lokasi event"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label-field">Tanggal *</label>
                  <input 
                    required 
                    type="date" 
                    className="input-field" 
                    value={form.eventDate} 
                    onChange={(e) => setForm({ ...form, eventDate: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="label-field">Jam Mulai *</label>
                  <input 
                    required 
                    type="time" 
                    className="input-field" 
                    value={form.startTime} 
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="label-field">Jam Selesai *</label>
                  <input 
                    required 
                    type="time" 
                    className="input-field" 
                    value={form.endTime} 
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })} 
                  />
                </div>
              </div>
              <div>
                <label className="label-field">Foto Event (opsional)</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImage} 
                  className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                />
                {form.imageUrl && (
                  <div className="mt-2">
                    <img src={form.imageUrl} alt="Preview" className="w-24 h-24 object-cover rounded-lg" />
                  </div>
                )}
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? 'Menyimpan...' : 'Simpan sebagai Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-ink-950/50 flex items-center justify-center z-50 px-4" onClick={() => setQrModal(null)}>
          <div className="card w-full max-w-xs p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg text-ink-900 mb-1">{qrModal.event.title}</h2>
            <p className="text-xs text-ink-700/50 mb-4">QR Code tautan registrasi event</p>
            <div className="bg-white p-4 rounded-lg mb-3">
              <img src={qrModal.qrCode} alt="QR Event" className="w-48 h-48 mx-auto" />
            </div>
            <a 
              href={qrModal.qrCode} 
              download={`qr-event-${qrModal.event.id}.png`} 
              className="btn-primary w-full block text-center"
            >
              Unduh QR Code
            </a>
            <button 
              onClick={() => setQrModal(null)}
              className="mt-3 text-sm text-ink-700/50 hover:text-ink-700 w-full"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}