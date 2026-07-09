import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar, Users, Zap, CheckCircle2, CalendarPlus, ScanLine, BarChart3, Mail, ArrowRight,
} from 'lucide-react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

function StatCard({ icon: Icon, iconBg, iconColor, label, value }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2} />
      </div>
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
    </div>
  );
}

const statusStyle = {
  published: 'bg-emerald-50 text-emerald-600',
  closed: 'bg-red-50 text-red-500',
  draft: 'bg-slate-100 text-slate-500',
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [allEvents, setAllEvents] = useState([]);
  const [weekly, setWeekly] = useState([]);

  async function fetchAll() {
    try {
      const [statsRes, activityRes, eventsRes, weeklyRes] = await Promise.all([
        api.get('/events/dashboard/stats'),
        api.get('/events/dashboard/activity'),
        api.get('/events'),
        api.get('/events/dashboard/weekly-attendance'),
      ]);
      setStats(statsRes.data.data);
      setActivity(activityRes.data.data);
      setAllEvents(eventsRes.data.data);
      setWeekly(weeklyRes.data.data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 8000); 
    return () => clearInterval(interval);
  }, []);

  const recentEvents = allEvents.slice(0, 5);
  const maxWeekly = Math.max(...weekly.map((d) => d.total), 1);
  const statusCounts = allEvents.reduce(
    (acc, e) => ({ ...acc, [e.status]: (acc[e.status] || 0) + 1 }),
    { draft: 0, published: 0, closed: 0 }
  );

  return (
    <DashboardLayout
      title="Dashboard Overview"
      subtitle="Ringkasan statistik & aktivitas seluruh event, diperbarui otomatis."
      actions={
        <Link to="/admin/events" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-colors">
          + Buat Event Baru
        </Link>
      }
    >
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard icon={Calendar} iconBg="bg-blue-50" iconColor="text-blue-600" label="Total Event" value={stats.totalEvents} />
          <StatCard icon={Users} iconBg="bg-violet-50" iconColor="text-violet-600" label="Total Peserta" value={stats.totalUsers} />
          <StatCard icon={Zap} iconBg="bg-amber-50" iconColor="text-amber-600" label="Event Aktif" value={stats.activeEvents} />
          <StatCard icon={CheckCircle2} iconBg="bg-emerald-50" iconColor="text-emerald-600" label="Attendance Rate" value={`${stats.attendanceRate}%`} />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        {/* Recent events table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900">Event Terbaru</h2>
            <Link to="/admin/events" className="text-sm text-blue-600 font-medium hover:underline">Lihat Semua</Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="pb-2.5 font-medium">Nama Event</th>
                <th className="pb-2.5 font-medium">Tanggal</th>
                <th className="pb-2.5 font-medium text-right">Pendaftar</th>
                <th className="pb-2.5 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentEvents.map((e) => (
                <tr key={e.id} className="border-b border-slate-50 last:border-0">
                  <td className="py-3 font-medium text-slate-800">{e.title}</td>
                  <td className="py-3 text-slate-500">{new Date(e.eventDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  <td className="py-3 text-right text-slate-700">{e.totalRegistrations}</td>
                  <td className="py-3 text-right">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[e.status]}`}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              ))}
              {recentEvents.length === 0 && (
                <tr><td colSpan={4} className="py-8 text-center text-slate-400">Belum ada event.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Quick actions */}
        <div className="bg-blue-600 rounded-2xl p-6 text-white">
          <h2 className="text-lg font-bold mb-1">Aksi Cepat</h2>
          <p className="text-sm text-blue-100 mb-5">Kelola fungsi utama secara instan.</p>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/admin/events" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 flex flex-col gap-2 transition-colors">
              <CalendarPlus className="w-5 h-5" />
              <span className="text-sm font-medium leading-tight">Buat Event</span>
            </Link>
            <Link to="/admin/scanner" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 flex flex-col gap-2 transition-colors">
              <ScanLine className="w-5 h-5" />
              <span className="text-sm font-medium leading-tight">Scanner</span>
            </Link>
            <Link to="/admin/reports" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 flex flex-col gap-2 transition-colors">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm font-medium leading-tight">Laporan</span>
            </Link>
            <Link to="/admin/email-logs" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 flex flex-col gap-2 transition-colors">
              <Mail className="w-5 h-5" />
              <span className="text-sm font-medium leading-tight">Log Email</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mb-5">
        
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-5">Kehadiran Mingguan</h2>
          <div className="flex items-end justify-between gap-2 h-32 mb-2">
            {weekly.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full">
                <div
                  className={`w-full rounded-md ${d.total > 0 ? 'bg-blue-600' : 'bg-slate-100'}`}
                  style={{ height: `${Math.max((d.total / maxWeekly) * 100, 4)}%` }}
                  title={`${d.total} check-in`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-5">
            {weekly.map((d) => <span key={d.date} className="flex-1 text-center">{d.label}</span>)}
          </div>
          {stats && (
            <div>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-500">Attendance Rate</span>
                <span className="font-semibold text-slate-900">{stats.attendanceRate}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${stats.attendanceRate}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Activity log */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-4">Log Aktivitas Terbaru</h2>
          <ul className="space-y-3 max-h-52 overflow-y-auto">
            {activity.map((a, i) => (
              <li key={i} className="flex gap-2.5 text-sm">
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${a.type === 'attendance' ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                <div>
                  <p className="text-slate-700 leading-snug">{a.message}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{new Date(a.timestamp).toLocaleString('id-ID')}</p>
                </div>
              </li>
            ))}
            {activity.length === 0 && <p className="text-sm text-slate-400 text-center py-6">Belum ada aktivitas.</p>}
          </ul>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-base font-bold text-slate-900 mb-4">Distribusi Status Event</h2>
          <div className="space-y-4">
            {[
              { key: 'published', label: 'Published', color: 'bg-emerald-500' },
              { key: 'draft', label: 'Draft', color: 'bg-slate-400' },
              { key: 'closed', label: 'Closed', color: 'bg-red-400' },
            ].map((s) => {
              const count = statusCounts[s.key] || 0;
              const pct = allEvents.length > 0 ? Math.round((count / allEvents.length) * 100) : 0;
              return (
                <div key={s.key}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-600">{s.label}</span>
                    <span className="font-semibold text-slate-900">{count}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full ${s.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <Link to="/admin/events" className="mt-5 flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline w-fit">
            Kelola semua event <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}