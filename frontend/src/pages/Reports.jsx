import { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';

export default function Reports() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/reports').then((res) => setData(res.data.data));
  }, []);

  if (!data) {
    return (
      <DashboardLayout title="Laporan">
        <p className="text-sm text-ink-700/50">Memuat laporan...</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Laporan" subtitle="Rekap performa pendaftaran & kehadiran per event.">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Event" value={data.summary.totalEvents} />
        <StatCard label="Total Pendaftar" value={data.summary.totalRegistrations} />
        <StatCard label="Total Hadir" value={data.summary.totalAttended} />
        <StatCard label="Attendance Rate" value={`${data.summary.overallAttendanceRate}%`} />
      </div>

      <div className="card overflow-x-auto">
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
            {data.perEvent.map((e) => (
              <tr key={e.eventId} className="border-b border-ink-700/5 last:border-0">
                <td className="p-3">{e.title}</td>
                <td className="p-3 text-xs text-ink-700/60">{new Date(e.eventDate).toLocaleDateString('id-ID')}</td>
                <td className="p-3"><span className="badge bg-ink-700/10 text-ink-700/60">{e.status}</span></td>
                <td className="p-3 text-right">{e.totalRegistrations}</td>
                <td className="p-3 text-right">{e.totalAttended}</td>
                <td className="p-3 text-right font-medium">{e.attendanceRate}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
