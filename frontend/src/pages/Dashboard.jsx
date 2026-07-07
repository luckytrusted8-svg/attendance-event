import { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [events, setEvents] = useState([]);

  async function fetchAll() {
    try {
      const [statsRes, activityRes, eventsRes] = await Promise.all([
        api.get('/events/dashboard/stats'),
        api.get('/events/dashboard/activity'),
        api.get('/events'),
      ]);
      setStats(statsRes.data.data);
      setActivity(activityRes.data.data);
      setEvents(eventsRes.data.data.slice(0, 6));
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 8000); // polling tiap 8 detik (PRD 8.2)
    return () => clearInterval(interval);
  }, []);

  return (
    <DashboardLayout title="Dashboard" subtitle="Ringkasan statistik & aktivitas seluruh event, diperbarui otomatis.">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Event" value={stats.totalEvents} />
          <StatCard label="Total Peserta" value={stats.totalUsers} />
          <StatCard label="Event Aktif" value={stats.activeEvents} hint="berstatus published" />
          <StatCard label="Attendance Rate" value={`${stats.attendanceRate}%`} hint={`${stats.totalAttended}/${stats.totalRegistrations} hadir`} />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 card p-5">
          <h2 className="font-display text-lg text-ink-900 mb-4">Event Terbaru</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-700/50 border-b border-ink-700/10">
                <th className="pb-2 font-medium">Judul</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium text-right">Pendaftar</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-ink-700/5 last:border-0">
                  <td className="py-2.5">{e.title}</td>
                  <td className="py-2.5">
                    <span className={`badge ${
                      e.status === 'published' ? 'bg-success/10 text-success'
                      : e.status === 'closed' ? 'bg-danger/10 text-danger'
                      : 'bg-ink-700/10 text-ink-700/60'
                    }`}>{e.status}</span>
                  </td>
                  <td className="py-2.5 text-right">{e.totalRegistrations}</td>
                </tr>
              ))}
              {events.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-ink-700/40">Belum ada event.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg text-ink-900 mb-4">Log Aktivitas Terbaru</h2>
          <ul className="space-y-3 max-h-96 overflow-y-auto">
            {activity.map((a, i) => (
              <li key={i} className="text-sm border-b border-ink-700/5 pb-2 last:border-0">
                <span className={`badge mr-2 ${a.type === 'attendance' ? 'bg-success/10 text-success' : 'bg-brand-500/10 text-brand-600'}`}>
                  {a.type === 'attendance' ? 'Check-in' : 'Daftar'}
                </span>
                <span className="text-ink-800">{a.message}</span>
                <p className="text-[11px] text-ink-700/40 mt-0.5">{new Date(a.timestamp).toLocaleString('id-ID')}</p>
              </li>
            ))}
            {activity.length === 0 && <p className="text-sm text-ink-700/40 text-center py-6">Belum ada aktivitas.</p>}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
