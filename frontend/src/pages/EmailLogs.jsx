import { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';

export default function EmailLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  async function fetchData() {
    const [logsRes, statsRes] = await Promise.all([
      api.get('/notifications/email-logs', { params: { status: statusFilter || undefined } }),
      api.get('/notifications/email-logs/stats'),
    ]);
    setLogs(logsRes.data.data);
    setStats(statsRes.data.data);
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  return (
    <DashboardLayout title="Log Email" subtitle="Riwayat pengiriman QR Code ke peserta.">
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <StatCard label="Total Terkirim" value={stats.total} />
          <StatCard label="Berhasil" value={stats.sent} />
          <StatCard label="Success Rate" value={`${stats.successRate}%`} />
        </div>
      )}

      <div className="mb-4 flex gap-2">
        {['', 'sent', 'failed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-md text-sm ${statusFilter === s ? 'bg-brand-600 text-white' : 'bg-white border border-ink-700/10 text-ink-700/70'}`}
          >
            {s === '' ? 'Semua' : s === 'sent' ? 'Terkirim' : 'Gagal'}
          </button>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-700/50 border-b border-ink-700/10 bg-brand-50/50">
              <th className="p-3 font-medium">Penerima</th>
              <th className="p-3 font-medium">Event</th>
              <th className="p-3 font-medium">Subjek</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Waktu</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l.id} className="border-b border-ink-700/5 last:border-0">
                <td className="p-3">{l.recipientName} <span className="text-ink-700/40">({l.recipientEmail})</span></td>
                <td className="p-3">{l.eventTitle}</td>
                <td className="p-3">{l.subject}</td>
                <td className="p-3">
                  <span className={`badge ${l.status === 'sent' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {l.status === 'sent' ? 'Terkirim' : 'Gagal'}
                  </span>
                </td>
                <td className="p-3 text-xs text-ink-700/60">{new Date(l.sentAt).toLocaleString('id-ID')}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-ink-700/40">Belum ada log email.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
