import { useEffect, useMemo, useState } from 'react';
import {
  Mail, CheckCircle2, XCircle, Eye, RefreshCw, Send, ChevronLeft, ChevronRight, ChevronDown, ShieldCheck,
} from 'lucide-react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const PAGE_SIZE = 8;

export default function EmailLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [events, setEvents] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [eventFilter, setEventFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState(null);
  const [smtpResult, setSmtpResult] = useState(null);
  const [checkingSmtp, setCheckingSmtp] = useState(false);

  async function fetchData() {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.get('/notifications/email-logs', {
          params: {
            status: statusFilter || undefined,
            eventId: eventFilter || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
        }),
        api.get('/notifications/email-logs/stats'),
      ]);
      setLogs(logsRes.data.data);
      setStats(statsRes.data.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get('/events').then((res) => setEvents(res.data.data));
  }, []);

  useEffect(() => {
    fetchData();
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, eventFilter, dateFrom, dateTo]);

  const totalPages = Math.max(Math.ceil(logs.length / PAGE_SIZE), 1);
  const paginated = useMemo(() => logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), [logs, page]);

  async function handleResend(id) {
    setResendingId(id);
    try {
      await api.post(`/notifications/email-logs/${id}/resend`);
      fetchData();
    } finally {
      setResendingId(null);
    }
  }

  async function handleCheckSmtp() {
    setCheckingSmtp(true);
    setSmtpResult(null);
    try {
      const res = await api.get('/notifications/smtp-status');
      setSmtpResult({ ok: res.data.success, message: res.data.message });
    } catch (err) {
      setSmtpResult({ ok: false, message: err.response?.data?.message || 'Gagal menghubungi server.' });
    } finally {
      setCheckingSmtp(false);
    }
  }

  return (
    <DashboardLayout
      title="Log Email"
      subtitle="Pantau riwayat pengiriman email otomatis sistem."
      actions={
        <button onClick={fetchData} className="flex items-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold px-4 py-2.5 rounded-lg text-sm">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      }
    >
      {/* Stat cards — semuanya data asli */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3"><Mail className="w-5 h-5" /></div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Terkirim</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats ? stats.sent.toLocaleString('id-ID') : '-'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center mb-3"><XCircle className="w-5 h-5" /></div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Gagal Kirim</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats ? stats.failed.toLocaleString('id-ID') : '-'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3"><CheckCircle2 className="w-5 h-5" /></div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Success Rate</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats ? `${stats.successRate}%` : '-'}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-3"><Eye className="w-5 h-5" /></div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Laju Terbuka</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{stats ? `${stats.openRate}%` : '-'}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">{stats?.opened || 0} dari {stats?.sent || 0} terkirim dibuka</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-5">
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Status Email</label>
            <div className="relative">
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg border border-slate-200 text-sm">
                <option value="">Semua Status</option>
                <option value="sent">Terkirim</option>
                <option value="failed">Gagal</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Dari Tanggal</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Sampai Tanggal</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm" />
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wide text-slate-400 mb-1.5">Event</label>
            <div className="relative">
              <select value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} className="w-full appearance-none px-3 py-2.5 pr-8 rounded-lg border border-slate-200 text-sm">
                <option value="">Semua Event</option>
                {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold">Penerima</th>
                <th className="p-4 font-semibold">Event</th>
                <th className="p-4 font-semibold">Subjek</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold">Dibuka</th>
                <th className="p-4 font-semibold">Waktu</th>
                <th className="p-4 font-semibold text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400">Memuat data...</td></tr>
              ) : paginated.length === 0 ? (
                <tr><td colSpan={7} className="p-10 text-center text-slate-400">Belum ada log email.</td></tr>
              ) : (
                paginated.map((l) => (
                  <tr key={l.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="p-4">
                      <p className="font-semibold text-slate-800">{l.recipientName}</p>
                      <p className="text-xs text-slate-400">{l.recipientEmail} · ID Peserta #{l.userId}</p>
                    </td>
                    <td className="p-4 text-slate-600">{l.eventTitle}</td>
                    <td className="p-4 text-slate-600">{l.subject}</td>
                    <td className="p-4">
                      <span
                        title={l.status === 'failed' ? (l.errorDetail || 'Tidak ada detail error.') : undefined}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          l.status === 'sent' ? 'bg-blue-50 text-blue-600'
                          : l.status === 'failed' ? 'bg-red-50 text-red-500 cursor-help'
                          : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${l.status === 'sent' ? 'bg-blue-600' : l.status === 'failed' ? 'bg-red-500' : 'bg-slate-400'}`} />
                        {l.status === 'sent' ? 'Terkirim' : l.status === 'failed' ? 'Gagal ⓘ' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">
                      {l.opened ? (
                        <span className="text-xs font-medium text-emerald-600">Ya</span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-xs text-slate-500">{new Date(l.sentAt).toLocaleString('id-ID')}</td>
                    <td className="p-4 text-right">
                      {l.status === 'failed' && (
                        <button
                          onClick={() => handleResend(l.id)}
                          disabled={resendingId === l.id}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" /> {resendingId === l.id ? 'Mengirim...' : 'Kirim Ulang'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <p className="text-sm text-slate-400">
              Menampilkan {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, logs.length)} dari {logs.length} entri
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

      {/* SMTP check banner — beneran menguji koneksi, bukan dekorasi */}
      <div className="bg-blue-600 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2"><ShieldCheck className="w-5 h-5" /> Butuh Bantuan Optimasi Email?</h2>
          <p className="text-sm text-blue-100 mt-1 max-w-xl">
            Pastikan konfigurasi SMTP di file <code className="bg-white/10 px-1.5 py-0.5 rounded">.env</code> backend sudah benar untuk menghindari kegagalan pengiriman.
          </p>
          {smtpResult && (
            <p className={`text-sm mt-2 font-medium ${smtpResult.ok ? 'text-emerald-200' : 'text-red-200'}`}>
              {smtpResult.ok ? '✓ ' : '✗ '}{smtpResult.message}
            </p>
          )}
        </div>
        <button
          onClick={handleCheckSmtp}
          disabled={checkingSmtp}
          className="shrink-0 bg-white hover:bg-blue-50 text-blue-700 font-semibold px-5 py-2.5 rounded-lg text-sm disabled:opacity-60"
        >
          {checkingSmtp ? 'Menguji...' : 'Cek Konfigurasi SMTP'}
        </button>
      </div>
    </DashboardLayout>
  );
}