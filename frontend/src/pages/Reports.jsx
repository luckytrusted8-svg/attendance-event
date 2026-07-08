import { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

// Ikon inline ringan (tanpa dependency baru)
function IconEvent(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}
function IconUsers(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.5 20c0-3.6 2.9-6.2 6.5-6.2s6.5 2.6 6.5 6.2" strokeLinecap="round" />
      <path d="M16 8.2a3 3 0 1 1 0 6M18.5 20c0-2.8-1.6-5-4-5.9" strokeLinecap="round" />
    </svg>
  );
}
function IconCheck(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.2l2.4 2.4 4.6-5.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function IconPercent(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M19 5L5 19" strokeLinecap="round" />
      <circle cx="7" cy="7" r="2.3" />
      <circle cx="17" cy="17" r="2.3" />
    </svg>
  );
}

const STATUS_STYLES = {
  published: { dot: 'bg-emerald-500', label: 'Published' },
  closed: { dot: 'bg-rose-500', label: 'Closed' },
  draft: { dot: 'bg-amber-500', label: 'Draft' },
};
const DEFAULT_STATUS = { dot: 'bg-ink-700/30', label: null };

function statusStyle(status) {
  return STATUS_STYLES[status] || { ...DEFAULT_STATUS, label: status };
}

export default function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/reports').then((res) => setData(res.data.data));
  }, []);

  const exportPdf = async () => {
    try {
      const response = await api.get('/reports/export/pdf', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' })
      );

      const link = document.createElement('a');
      link.href = url;
      link.download = 'Laporan-Event.pdf';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Gagal mengexport PDF');
    }
  };

  const exportExcel = async () => {
    try {
      const response = await api.get('/reports/export/excel', {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement('a');
      link.href = url;
      link.download = 'Laporan-Event.xlsx';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Gagal mengexport Excel');
    }
  };

  if (!data) {
    return (
      <DashboardLayout title="Laporan">
        <p className="text-sm text-ink-700/50">Memuat laporan...</p>
      </DashboardLayout>
    );
  }

  const { summary, perEvent } = data;

  return (
    <DashboardLayout title="Laporan" subtitle="Rekap performa pendaftaran & kehadiran per event.">
      {/* Stat cards — 3 kartu putih + 1 kartu aksen brand, seperti referensi */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold text-ink-900">{summary.totalEvents}</p>
            <p className="text-sm text-ink-700/50 mt-1">Total Event</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
            <IconEvent className="w-5 h-5" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold text-ink-900">{summary.totalRegistrations}</p>
            <p className="text-sm text-ink-700/50 mt-1">Total Pendaftar</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
            <IconUsers className="w-5 h-5" />
          </div>
        </div>

        <div className="card p-5 flex items-center justify-between">
          <div>
            <p className="text-2xl font-semibold text-ink-900">{summary.totalAttended}</p>
            <p className="text-sm text-ink-700/50 mt-1">Total Hadir</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-500 flex items-center justify-center">
            <IconCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="rounded-2xl bg-brand-500 p-5 flex items-center justify-between text-white shadow-sm">
          <div>
            <p className="text-2xl font-semibold">{summary.overallAttendanceRate}%</p>
            <p className="text-sm text-white/80 mt-1">Attendance Rate</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center">
            <IconPercent className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabel laporan per event */}
      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between p-5 pb-0 gap-3">
          <div>
            <h2 className="font-display text-lg text-ink-900">Laporan per Event</h2>
            <p className="text-xs text-ink-700/50 mt-0.5">{perEvent.length} event</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportPdf}
              className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
            >
              📄 PDF
            </button>
            <button
              onClick={exportExcel}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition"
            >
              📊 Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-700/50 border-b border-ink-700/10 bg-brand-50/50">
                <th className="p-3 font-medium">Event</th>
                <th className="p-3 font-medium">Tanggal</th>
                <th className="p-3 font-medium">Status</th>
                <th className="p-3 font-medium text-right">Pendaftar</th>
                <th className="p-3 font-medium text-right">Hadir</th>
                <th className="p-3 font-medium text-right">Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {perEvent.map((e) => {
                const s = statusStyle(e.status);
                return (
                  <tr key={e.eventId} className="border-b border-ink-700/5 last:border-0 hover:bg-ink-700/[0.03]">
                    <td className="p-3 text-ink-900">{e.title}</td>
                    <td className="p-3 text-xs text-ink-700/60">
                      {new Date(e.eventDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-3">
                      <span className="flex items-center gap-2 text-ink-700/70">
                        <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                        {s.label || e.status}
                      </span>
                    </td>
                    <td className="p-3 text-right text-ink-900">{e.totalRegistrations}</td>
                    <td className="p-3 text-right text-ink-900">{e.totalAttended}</td>
                    <td className="p-3 text-right font-medium text-ink-900">{e.attendanceRate}%</td>
                  </tr>
                );
              })}
              {perEvent.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-700/40">
                    Belum ada data laporan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}