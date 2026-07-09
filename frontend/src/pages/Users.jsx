import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Search, Download, FileSpreadsheet, UserPlus, X, Save, User, Mail, Phone,
  Building2, Calendar, ChevronLeft, ChevronRight, ChevronDown,
} from 'lucide-react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const PAGE_SIZE = 10;

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const emptyForm = { fullname: '', email: '', phone: '', institution: '', eventId: '' };

export default function Users() {
  const [view, setView] = useState('list'); // 'list' | 'add'
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { search, eventId: eventFilter || undefined } });
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get('/events').then((res) => setEvents(res.data.data));
  }, []);

  useEffect(() => {
    fetchUsers();
    setPage(1);
    setSelected(new Set());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, eventFilter]);

  const statistics = useMemo(() => {
    const total = users.length;
    const hadir = users.filter((u) => u.totalCheckIns > 0).length;
    const rate = total > 0 ? Math.round((hadir / total) * 100) : 0;
    const startOfMonth = new Date(); startOfMonth.setDate(1); startOfMonth.setHours(0, 0, 0, 0);
    const baruBulanIni = users.filter((u) => new Date(u.createdAt) >= startOfMonth).length;
    return { total, hadir, rate, baruBulanIni };
  }, [users]);

  const totalPages = Math.max(Math.ceil(users.length / PAGE_SIZE), 1);
  const paginated = users.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSelect(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }
  function toggleSelectAll() {
    if (selected.size === paginated.length) setSelected(new Set());
    else setSelected(new Set(paginated.map((u) => u.id)));
  }

  function rowsToExport() {
    const source = selected.size > 0 ? users.filter((u) => selected.has(u.id)) : users;
    return source.map((u) => ({
      Nama: u.fullname,
      Email: u.email,
      Telepon: u.phone || '-',
      Institusi: u.institution || '-',
      'Total Registrasi': u.totalRegistrations || 0,
      'Total Check-in': u.totalCheckIns || 0,
      Terdaftar: formatDate(u.createdAt),
    }));
  }

  function exportCsv() {
    const rows = rowsToExport();
    const headers = Object.keys(rows[0] || {});
    const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => `"${String(r[h]).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data-peserta.csv';
    link.click();
  }

  function exportExcel() {
    const rows = rowsToExport();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data Peserta');
    XLSX.writeFile(wb, 'data-peserta.xlsx');
  }

  function openAddForm() {
    setForm(emptyForm);
    setError('');
    setResult(null);
    setView('add');
  }

  async function handleAddSubmit(e) {
    e.preventDefault();
    if (!form.eventId) { setError('Pilih event yang akan diikuti.'); return; }
    setError('');
    setSaving(true);
    try {
      const res = await api.post(`/events/${form.eventId}/registrations/manual`, {
        fullname: form.fullname, email: form.email, phone: form.phone, institution: form.institution,
      });
      setResult(res.data.data);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan peserta.');
    } finally {
      setSaving(false);
    }
  }

  // ---------- Tambah Peserta (offline registration) ----------
  if (view === 'add') {
    return (
      <DashboardLayout
        title="Tambah Peserta"
        subtitle="Input data partisipan baru ke dalam sistem (pendaftaran offline / di lokasi)."
        actions={
          <button onClick={() => setView('list')} className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2.5 rounded-lg text-sm">
            <X className="w-4 h-4" /> Batal
          </button>
        }
      >
        <div className="max-w-2xl">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            {result ? (
              <div className="text-center py-4">
                <p className="text-lg font-bold text-slate-900 mb-1">Peserta Berhasil Ditambahkan 🎉</p>
                <p className="text-sm text-slate-500 mb-4">
                  QR Code kehadiran telah dikirim ke email peserta. Anda juga bisa unduh/cetak QR di bawah ini sekarang.
                </p>
                <img src={result.qrDataUrl} alt="QR Code" className="w-40 h-40 mx-auto rounded-lg border border-slate-200 mb-3" />
                <p className="text-xs text-slate-400 font-mono mb-5">{result.qrCode}</p>
                <div className="flex gap-2 max-w-xs mx-auto">
                  <a href={result.qrDataUrl} download={`qr-${result.qrCode}.png`} className="flex-1 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2.5 rounded-lg text-sm">Unduh QR</a>
                  <button onClick={() => setView('list')} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm">Selesai</button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input required value={form.fullname} onChange={(e) => setForm({ ...form, fullname: e.target.value })}
                      placeholder="Masukkan nama lengkap"
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="contoh@email.com"
                        className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">No. Telepon</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="0812xxxx"
                        className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Institusi</label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })}
                      placeholder="Nama instansi atau organisasi"
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Pilih Event</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <select required value={form.eventId} onChange={(e) => setForm({ ...form, eventId: e.target.value })}
                      className="w-full pl-10 pr-9 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white">
                      <option value="">Pilih event yang akan diikuti</option>
                      {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                {error && <p className="text-sm text-red-500">{error}</p>}

                <button type="submit" disabled={saving} className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-3 rounded-lg text-sm transition-colors">
                  <Save className="w-4 h-4" /> {saving ? 'Menyimpan...' : 'Simpan Peserta'}
                </button>
                <p className="text-xs text-slate-400 text-center">* Pastikan seluruh data telah terisi dengan benar sebelum menyimpan.</p>
              </form>
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ---------- Daftar Peserta ----------
  return (
    <DashboardLayout
      title="Data Peserta"
      subtitle="Kelola data seluruh partisipan event Anda di satu tempat."
      actions={
        <button onClick={openAddForm} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
          <UserPlus className="w-4 h-4" /> Tambah Peserta
        </button>
      }
    >
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Total Peserta</p>
          <p className="text-3xl font-extrabold text-blue-600">{statistics.total.toLocaleString('id-ID')}</p>
          <p className="text-xs text-slate-400 mt-1">{statistics.baruBulanIni} baru bulan ini</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Peserta Sudah Check-in</p>
          <p className="text-3xl font-extrabold text-emerald-600">{statistics.hadir.toLocaleString('id-ID')}</p>
          <p className="text-xs text-slate-400 mt-1">{statistics.rate}% dari total peserta</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <p className="text-sm text-slate-500 mb-1">Belum Check-in</p>
          <p className="text-3xl font-extrabold text-amber-600">{(statistics.total - statistics.hadir).toLocaleString('id-ID')}</p>
          <p className="text-xs text-slate-400 mt-1">Belum hadir di event manapun</p>
        </div>
      </div>

      {/* Filter + export bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama atau email peserta..."
            className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2.5 text-sm md:w-56">
          <option value="">Semua Event</option>
          {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
        </select>
        <button onClick={exportCsv} disabled={users.length === 0} className="flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-600 font-semibold px-4 py-2.5 rounded-lg text-sm whitespace-nowrap">
          <Download className="w-4 h-4" /> Export CSV
        </button>
        <button onClick={exportExcel} disabled={users.length === 0} className="flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 disabled:opacity-40 text-slate-600 font-semibold px-4 py-2.5 rounded-lg text-sm whitespace-nowrap">
          <FileSpreadsheet className="w-4 h-4" /> Excel
        </button>
      </div>

      {search && <p className="text-sm text-slate-400 mb-3">Menampilkan hasil untuk: <span className="font-medium text-slate-700">"{search}"</span></p>}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400">
            <div className="inline-block animate-spin rounded-full h-7 w-7 border-4 border-blue-500 border-t-transparent" />
            <p className="mt-2 text-sm">Memuat data peserta...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
                  <th className="p-4 w-10">
                    <input type="checkbox" checked={paginated.length > 0 && selected.size === paginated.length} onChange={toggleSelectAll} className="rounded border-slate-300" />
                  </th>
                  <th className="p-4 font-semibold">Nama</th>
                  <th className="p-4 font-semibold">Email</th>
                  <th className="p-4 font-semibold">Telepon</th>
                  <th className="p-4 font-semibold">Institusi</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                  <th className="p-4 font-semibold">Terdaftar</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((u) => (
                  <tr key={u.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="p-4">
                      <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} className="rounded border-slate-300" />
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-slate-800">{u.fullname}</span>
                    </td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4 text-slate-600">{u.phone || '-'}</td>
                    <td className="p-4 text-slate-600">{u.institution || '-'}</td>
                    <td className="p-4 text-center">
                      {u.totalCheckIns > 0 ? (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600">Hadir</span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">Belum Hadir</span>
                      )}
                    </td>
                    <td className="p-4 text-slate-500 text-xs">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="p-10 text-center text-slate-400">
                    {search || eventFilter ? 'Tidak ada peserta yang cocok dengan filter.' : 'Belum ada peserta terdaftar.'}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && users.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-400">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, users.length)} dari {users.length} peserta
              {selected.size > 0 && <span className="text-blue-600 font-medium"> · {selected.size} dipilih</span>}
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
        )}
      </div>
    </DashboardLayout>
  );
}