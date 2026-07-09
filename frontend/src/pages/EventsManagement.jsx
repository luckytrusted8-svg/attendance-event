import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search, SlidersHorizontal, Pencil, Eye, Trash2, QrCode, ChevronLeft, ChevronRight,
  MapPin, Calendar, Info, Clock, Ticket, Image as ImageIcon, Plus, X, ChevronDown,
} from 'lucide-react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const PAGE_SIZE = 5;

const statusMeta = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-500' },
  published: { label: 'Aktif', className: 'bg-blue-50 text-blue-600' },
  closed: { label: 'Ditutup', className: 'bg-red-50 text-red-500' },
};

const emptyForm = {
  title: '', description: '', category: '', location: '', isOnline: false,
  isPaid: false, price: '', capacity: '',
  eventDate: '', startTime: '', endTime: '', imageUrl: '', agenda: [],
};

function formatDateTime(event) {
  const date = new Date(event.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  const start = new Date(event.startTime).toISOString().slice(11, 16);
  const end = new Date(event.endTime).toISOString().slice(11, 16);
  return { date, time: `${start} - ${end}` };
}

function SectionCard({ icon: Icon, iconBg, iconColor, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h2 className="text-base font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </div>
  );
}

const inputClass = "w-full border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const labelClass = "block text-sm font-medium text-slate-700 mb-1.5";

export default function EventsManagement() {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('latest');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [qrModal, setQrModal] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState('');

  async function fetchEvents() {
    const res = await api.get('/events', { params: { search } });
    setEvents(res.data.data);
  }
  async function fetchCategories() {
    const res = await api.get('/categories');
    setCategories(res.data.data);
  }

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => { fetchCategories(); }, []);

  const categoryNames = useMemo(
    () => [...new Set([...categories.map((c) => c.name), ...events.map((e) => e.category).filter(Boolean)])],
    [categories, events]
  );

  const filtered = useMemo(() => {
    let list = [...events];
    if (statusFilter !== 'all') list = list.filter((e) => e.status === statusFilter);
    if (categoryFilter !== 'all') list = list.filter((e) => e.category === categoryFilter);
    switch (sortFilter) {
      case 'oldest': list.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate)); break;
      case 'a-z': list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'z-a': list.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'most-registrants': list.sort((a, b) => (b.totalRegistrations || 0) - (a.totalRegistrations || 0)); break;
      default: list.sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
    }
    return list;
  }, [events, statusFilter, categoryFilter, sortFilter]);

  useEffect(() => setPage(1), [search, statusFilter, categoryFilter, sortFilter]);

  const totalPages = Math.max(Math.ceil(filtered.length / PAGE_SIZE), 1);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleImage(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, imageUrl: reader.result }));
    reader.readAsDataURL(file);
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setView('form');
  }

  function openEditForm(event) {
    setEditingId(event.id);
    setForm({
      title: event.title || '',
      description: event.description || '',
      category: event.category || '',
      location: event.location || '',
      isOnline: event.isOnline || false,
      isPaid: event.isPaid || false,
      price: event.price ?? '',
      capacity: event.capacity ?? '',
      eventDate: event.eventDate ? event.eventDate.slice(0, 10) : '',
      startTime: new Date(event.startTime).toISOString().slice(11, 16),
      endTime: new Date(event.endTime).toISOString().slice(11, 16),
      imageUrl: event.imageUrl || '',
      agenda: Array.isArray(event.agenda) ? event.agenda : [],
    });
    setError('');
    setView('form');
  }

  function addAgendaRow() {
    setForm((f) => ({ ...f, agenda: [...f.agenda, { time: '', title: '', speaker: '' }] }));
  }
  function updateAgendaRow(index, field, value) {
    setForm((f) => {
      const agenda = [...f.agenda];
      agenda[index] = { ...agenda[index], [field]: value };
      return { ...f, agenda };
    });
  }
  function removeAgendaRow(index) {
    setForm((f) => ({ ...f, agenda: f.agenda.filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, agenda: form.agenda.filter((a) => a.title?.trim()) };
      if (editingId) {
        await api.put(`/events/${editingId}`, payload);
      } else {
        await api.post('/events', payload);
      }
      setView('list');
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan event.');
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

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/events/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchEvents();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus event.');
    } finally {
      setDeleting(false);
    }
  }

  async function handleAddCategory() {
    setCategoryError('');
    if (!newCategory.trim()) return;
    try {
      await api.post('/categories', { name: newCategory.trim() });
      setNewCategory('');
      fetchCategories();
    } catch (err) {
      setCategoryError(err.response?.data?.message || 'Gagal menambah kategori.');
    }
  }
  async function handleDeleteCategory(id) {
    await api.delete(`/categories/${id}`);
    fetchCategories();
  }

  // ==================== FULL PAGE FORM (Buat/Edit Event) ====================
  if (view === 'form') {
    return (
      <DashboardLayout
        title={editingId ? 'Edit Event' : 'Buat Event Baru'}
        subtitle="Rencanakan dan kelola event profesional Anda dalam hitungan menit."
      >
        <form onSubmit={handleSubmit} className="max-w-4xl space-y-6">
          {/* Informasi Dasar */}
          <SectionCard icon={Info} iconBg="bg-blue-50" iconColor="text-blue-600" title="Informasi Dasar">
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Nama Event</label>
                <input required className={inputClass} placeholder="Contoh: Global Tech Conference 2024"
                  value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Kategori Event</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <select className={`${inputClass} appearance-none pr-9`} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                      <option value="">-- Pilih kategori --</option>
                      {categoryNames.map((name) => <option key={name} value={name}>{name}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button type="button" onClick={() => setShowCategoryModal(true)}
                    title="Kelola kategori" className="shrink-0 w-11 h-11 flex items-center justify-center rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div>
                <label className={labelClass}>Deskripsi Event</label>
                <textarea rows={4} className={inputClass} placeholder="Jelaskan detail event Anda di sini..."
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
            </div>
          </SectionCard>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Tanggal & Waktu */}
            <SectionCard icon={Calendar} iconBg="bg-amber-50" iconColor="text-amber-600" title="Tanggal & Waktu">
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>Tanggal Event</label>
                  <input required type="date" className={inputClass} value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Waktu Mulai</label>
                    <input required type="time" className={inputClass} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
                  </div>
                  <div>
                    <label className={labelClass}>Waktu Selesai</label>
                    <input required type="time" className={inputClass} value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
                  </div>
                </div>
                <p className="text-xs text-slate-400">Event multi-hari belum didukung event berlangsung dalam satu tanggal yang sama.</p>
              </div>
            </SectionCard>

            {/* Lokasi */}
            <SectionCard icon={MapPin} iconBg="bg-violet-50" iconColor="text-violet-600" title="Lokasi">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Online Event</label>
                  <button type="button" onClick={() => setForm({ ...form, isOnline: !form.isOnline })}
                    className={`w-11 h-6 rounded-full transition-colors relative ${form.isOnline ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${form.isOnline ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div>
                  <label className={labelClass}>{form.isOnline ? 'Platform (Zoom, Google Meet, dll)' : 'Nama Venue / Alamat'}</label>
                  <input className={inputClass} placeholder={form.isOnline ? 'Contoh: Zoom Meeting' : 'Contoh: Jakarta Convention Center'}
                    value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
                </div>
              </div>
            </SectionCard>
          </div>

          {/* Tiket & Kapasitas */}
          <SectionCard icon={Ticket} iconBg="bg-emerald-50" iconColor="text-emerald-600" title="Tiket & Kapasitas">
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Tipe Tiket</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm({ ...form, isPaid: false, price: '' })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border ${!form.isPaid ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600'}`}>
                    Gratis
                  </button>
                  <button type="button" onClick={() => setForm({ ...form, isPaid: true })}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-semibold border ${form.isPaid ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-600'}`}>
                    Berbayar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Harga (IDR)</label>
                  <input type="number" min="0" disabled={!form.isPaid} className={`${inputClass} disabled:bg-slate-50 disabled:text-slate-400`}
                    placeholder="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div>
                  <label className={labelClass}>Kuota / Kapasitas</label>
                  <input type="number" min="1" className={inputClass} placeholder="Kosongkan jika tidak dibatasi"
                    value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} />
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Rundown Acara */}
          <SectionCard icon={Clock} iconBg="bg-rose-50" iconColor="text-rose-600" title="Rundown Acara">
            <div className="space-y-3">
              {form.agenda.map((row, i) => (
                <div key={i} className="grid grid-cols-[110px_1fr_36px] gap-2 items-start">
                  <input placeholder="19.00 - 19.05" className={inputClass} value={row.time}
                    onChange={(e) => updateAgendaRow(i, 'time', e.target.value)} />
                  <div className="space-y-1.5">
                    <input placeholder="Agenda (cth: Pembukaan oleh moderator)" className={inputClass} value={row.title}
                      onChange={(e) => updateAgendaRow(i, 'title', e.target.value)} />
                    <input placeholder="Pembicara (opsional)" className={`${inputClass} text-xs`} value={row.speaker}
                      onChange={(e) => updateAgendaRow(i, 'speaker', e.target.value)} />
                  </div>
                  <button type="button" onClick={() => removeAgendaRow(i)} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button type="button" onClick={addAgendaRow}
                className="w-full border-2 border-dashed border-slate-200 rounded-lg py-3 text-sm font-semibold text-slate-400 hover:border-blue-300 hover:text-blue-500 flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> Tambah Jadwal
              </button>
            </div>
          </SectionCard>

          {/* Media Event */}
          <SectionCard icon={ImageIcon} iconBg="bg-cyan-50" iconColor="text-cyan-600" title="Media Event">
            <input type="file" accept="image/*" onChange={handleImage} className="text-sm" />
            {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="w-28 h-28 object-cover rounded-lg mt-3" />}
          </SectionCard>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 pb-6">
            <button type="button" onClick={() => setView('list')} className="border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-6 py-2.5 rounded-lg text-sm">
              Batal
            </button>
            <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-lg text-sm">
              {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan sebagai Draft'}
            </button>
          </div>
        </form>

        {/* Category management modal */}
        {showCategoryModal && (
          <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 px-4" onClick={() => setShowCategoryModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-900">Kelola Kategori</h2>
                <button onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex gap-2 mb-4">
                <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="Nama kategori baru"
                  className={inputClass} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())} />
                <button type="button" onClick={handleAddCategory} className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-4 rounded-lg text-sm font-semibold">Tambah</button>
              </div>
              {categoryError && <p className="text-sm text-red-500 mb-3">{categoryError}</p>}
              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                {categories.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50">
                    <span className="text-sm text-slate-700">{c.name}</span>
                    <button type="button" onClick={() => handleDeleteCategory(c.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
                {categories.length === 0 && <p className="text-sm text-slate-400 text-center py-4">Belum ada kategori.</p>}
              </ul>
            </div>
          </div>
        )}
      </DashboardLayout>
    );
  }

  // ==================== LIST VIEW ====================
  return (
    <DashboardLayout
      title="Kelola Event"
      subtitle="Ringkasan seluruh event dan workshop yang telah dibuat."
      actions={
        <button onClick={openCreateForm} className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
          + Buat Event Baru
        </button>
      }
    >
      {/* Filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Cari Event</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter berdasarkan nama..."
                className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Semua Status</option>
              <option value="draft">Draft</option>
              <option value="published">Aktif</option>
              <option value="closed">Ditutup</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Kategori</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">Semua Kategori</option>
              {categoryNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <button onClick={() => setShowMoreFilters((s) => !s)}
              className="w-full flex items-center justify-center gap-2 border border-blue-200 text-blue-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-blue-50 transition-colors">
              <SlidersHorizontal className="w-4 h-4" /> Filter Lainnya
            </button>
          </div>
        </div>

        {showMoreFilters && (
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-4 border-t border-slate-100">
            <span className="text-xs text-slate-400 font-medium">Urutkan:</span>
            <select value={sortFilter} onChange={(e) => setSortFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
              <option value="latest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="a-z">Nama A-Z</option>
              <option value="z-a">Nama Z-A</option>
              <option value="most-registrants">Pendaftar Terbanyak</option>
            </select>
            <button onClick={() => { setStatusFilter('all'); setCategoryFilter('all'); setSortFilter('latest'); setSearch(''); }} className="text-sm text-slate-400 hover:text-slate-600">
              Reset semua filter
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold">Nama Event</th>
                <th className="p-4 font-semibold">Tanggal & Waktu</th>
                <th className="p-4 font-semibold">Lokasi</th>
                <th className="p-4 font-semibold">Tiket</th>
                <th className="p-4 font-semibold">Pendaftar</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((e) => {
                const { date, time } = formatDateTime(e);
                const pct = e.capacity ? Math.min(Math.round((e.totalRegistrations / e.capacity) * 100), 100) : null;
                return (
                  <tr key={e.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center text-slate-300 font-bold">
                          {e.imageUrl ? <img src={e.imageUrl} alt="" className="w-full h-full object-cover" /> : e.title.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 leading-tight">{e.title}</p>
                          {e.category && <p className="text-xs text-slate-400 mt-0.5">{e.category}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-slate-400" />{date}</div>
                      <p className="text-xs text-slate-400 mt-0.5 ml-5">{time}</p>
                    </td>
                    <td className="p-4 text-slate-600">
                      <div className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{e.isOnline ? 'Online' : (e.location || '-')}</div>
                    </td>
                    <td className="p-4 text-slate-600">
                      {e.isPaid ? `Rp ${Number(e.price || 0).toLocaleString('id-ID')}` : <span className="text-emerald-600 font-medium">Gratis</span>}
                    </td>
                    <td className="p-4">
                      <p className="text-slate-700">{e.totalRegistrations}{e.capacity ? ` / ${e.capacity}` : ''}</p>
                      {pct !== null && (
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-24 mt-1.5">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta[e.status]?.className}`}>
                        {statusMeta[e.status]?.label || e.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => showQr(e)} title="QR Event" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button onClick={() => openEditForm(e)} title="Edit" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <Link to={`/events/${e.id}`} target="_blank" title="Lihat halaman publik" className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button onClick={() => setDeleteTarget(e)} title="Hapus" className="p-2 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {e.status !== 'published' ? (
                          <button onClick={() => toggleStatus(e, 'published')} className="ml-1 text-xs font-semibold text-blue-600 hover:underline whitespace-nowrap">Publish</button>
                        ) : (
                          <button onClick={() => toggleStatus(e, 'closed')} className="ml-1 text-xs font-semibold text-slate-400 hover:underline whitespace-nowrap">Tutup</button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400">Tidak ada event yang cocok dengan filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
          <p className="text-sm text-slate-400">
            Menampilkan {paginated.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length} event
          </p>
          <div className="flex items-center gap-1.5">
            <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 flex items-center justify-center hover:bg-slate-50">
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 5).map((p) => (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-sm font-medium ${p === page ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}>{p}</button>
            ))}
            <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="w-8 h-8 rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 flex items-center justify-center hover:bg-slate-50">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* QR modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 px-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl w-full max-w-xs p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900 mb-1">{qrModal.event.title}</h2>
            <p className="text-xs text-slate-400 mb-4">QR Code tautan registrasi event</p>
            <img src={qrModal.qrCode} alt="QR Event" className="w-48 h-48 mx-auto rounded-lg border border-slate-200 mb-3" />
            <a href={qrModal.qrCode} download={`qr-event-${qrModal.event.id}.png`} className="w-full block bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-semibold">Unduh QR Code</a>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 px-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1">Hapus Event?</h2>
            <p className="text-sm text-slate-500 mb-5">
              "{deleteTarget.title}" beserta seluruh data pendaftar, kehadiran, dan log email akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 border border-slate-200 rounded-lg py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Batal</button>
              <button onClick={confirmDelete} disabled={deleting} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-lg py-2.5 text-sm font-semibold">
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}