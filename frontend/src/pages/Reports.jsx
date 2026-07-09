import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Wallet, Users, CheckCircle2, Star, Download, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const statusMeta = {
  draft: { label: 'Draft', className: 'bg-slate-100 text-slate-500' },
  published: { label: 'Aktif', className: 'bg-blue-50 text-blue-600' },
  closed: { label: 'Ditutup', className: 'bg-red-50 text-red-500' },
};
const CATEGORY_COLORS = ['bg-blue-600', 'bg-slate-700', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500', 'bg-violet-500'];

function formatRupiah(n) {
  return `Rp ${Number(n || 0).toLocaleString('id-ID')}`;
}
function formatRupiahShort(n) {
  if (n >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toFixed(1)}M`;
  if (n >= 1_000_000) return `Rp ${(n / 1_000_000).toFixed(1)}jt`;
  return formatRupiah(n);
}
function initialsOf(name = '') {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function Reports() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(30);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    api.get('/reports', { params: { days } }).then((res) => setData(res.data.data));
  }, [days]);

  function exportExcel() {
    const rows = data.perEvent.map((e) => ({
      Event: e.title,
      Tanggal: new Date(e.eventDate).toLocaleDateString('id-ID'),
      Kategori: e.category || '-',
      Status: statusMeta[e.status]?.label || e.status,
      Pendaftar: e.totalRegistrations,
      Hadir: e.totalAttended,
      'Attendance Rate (%)': e.attendanceRate,
      'Estimasi Pendapatan (Rp)': e.revenue,
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Event');
    XLSX.writeFile(wb, 'laporan-event.xlsx');
    setShowExportMenu(false);
  }

  function exportPdf() {
    setShowExportMenu(false);
    window.print();
  }

  if (!data) {
    return (
      <DashboardLayout title="Laporan Analitik">
        <p className="text-sm text-slate-400">Memuat laporan...</p>
      </DashboardLayout>
    );
  }

  const { summary, perEvent, revenueByCategory, registrationTrend } = data;

  return (
    <DashboardLayout
      title="Laporan Analitik"
      subtitle="Pantau performa event dan partisipasi berdasarkan data real."
      actions={
        <div className="flex items-center gap-3 print:hidden">
          <div className="relative">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="appearance-none border border-slate-200 rounded-lg pl-4 pr-9 py-2.5 text-sm font-medium text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>7 Hari Terakhir</option>
              <option value={30}>30 Hari Terakhir</option>
              <option value={90}>90 Hari Terakhir</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          <div className="relative">
            <button onClick={() => setShowExportMenu((s) => !s)} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg">
              <Download className="w-4 h-4" /> Export Report
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-44 bg-white rounded-lg border border-slate-200 shadow-lg overflow-hidden z-20">
                <button onClick={exportExcel} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Export sebagai Excel</button>
                <button onClick={exportPdf} className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">Export sebagai PDF</button>
              </div>
            )}
          </div>
        </div>
      }
    >
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
            <Wallet className="w-5 h-5" />
          </div>
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Estimasi Pendapatan</p>
          <p className="text-2xl font-extrabold text-slate-900">{formatRupiah(summary.totalRevenue)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Harga tiket × jumlah pendaftar (event berbayar)</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-11 h-11 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Total Peserta</p>
          <p className="text-2xl font-extrabold text-slate-900">{summary.totalRegistrations.toLocaleString('id-ID')}</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Rata-rata Kehadiran</p>
          <p className="text-2xl font-extrabold text-slate-900">{summary.overallAttendanceRate}%</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
            <Star className="w-5 h-5" />
          </div>
          <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold mb-1">Event Terpopuler</p>
          <p className="text-lg font-extrabold text-slate-900 leading-tight">{summary.mostPopularEvent?.title || '-'}</p>
          {summary.mostPopularEvent && <p className="text-[11px] text-slate-400 mt-1">{summary.mostPopularEvent.totalRegistrations} pendaftar</p>}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-6">
        {/* Trend chart — real data */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-900">Tren Registrasi Peserta</h2>
          <p className="text-xs text-slate-400 mb-4">Data registrasi & check-in harian, {days} hari terakhir</p>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={registrationTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} tick={{ fontSize: 11, fill: '#94a3b8' }} interval={Math.floor(days / 6)} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip labelFormatter={(d) => new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="registrations" name="Registrasi" stroke="#2563eb" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="checkins" name="Check-in" stroke="#93c5fd" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue per category — real data */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-base font-bold text-slate-900">Estimasi Pendapatan per Kategori</h2>
          <p className="text-xs text-slate-400 mb-5">Distribusi dari event berbayar</p>
          {revenueByCategory.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Belum ada event berbayar.</p>
          ) : (
            <div className="space-y-4">
              {revenueByCategory.map((c, i) => (
                <div key={c.category}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-slate-700">{c.category}</span>
                    <span className="text-slate-500">{c.percentage}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                    <div className={`h-full rounded-full ${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}`} style={{ width: `${c.percentage}%` }} />
                  </div>
                  <p className="text-xs text-slate-400">{formatRupiahShort(c.revenue)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Performa per Event</h2>
            <p className="text-xs text-slate-400 mt-0.5">{perEvent.length} event</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 bg-slate-50 border-b border-slate-200">
                <th className="p-4 font-semibold">Nama Event</th>
                <th className="p-4 font-semibold">Tanggal</th>
                <th className="p-4 font-semibold text-right">Partisipan</th>
                <th className="p-4 font-semibold text-right">Hadir</th>
                <th className="p-4 font-semibold text-right">Estimasi Pendapatan</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {perEvent.map((e) => (
                <tr key={e.eventId} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {initialsOf(e.title)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 leading-tight">{e.title}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{e.location || e.category || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-slate-600">{new Date(e.eventDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="p-4 text-right text-slate-700">{e.totalRegistrations.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right text-slate-700">{e.totalAttended.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-right font-semibold text-slate-900">{e.isPaid ? formatRupiahShort(e.revenue) : <span className="text-emerald-600 font-normal">Gratis</span>}</td>
                  <td className="p-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusMeta[e.status]?.className}`}>
                      {statusMeta[e.status]?.label || e.status}
                    </span>
                  </td>
                </tr>
              ))}
              {perEvent.length === 0 && (
                <tr><td colSpan={6} className="p-10 text-center text-slate-400">Belum ada data laporan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}