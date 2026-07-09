import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

export default function EventParticipants() {
  const { id } = useParams();
  const [registrations, setRegistrations] = useState([]);
  const [search, setSearch] = useState('');
  const [eventTitle, setEventTitle] = useState('');

  async function fetchData() {
    const [regRes, eventRes] = await Promise.all([
      api.get(`/events/${id}/registrations`, { params: { search } }),
      api.get(`/events/${id}`),
    ]);
    setRegistrations(regRes.data.data);
    setEventTitle(eventRes.data.data.title);
  }

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000); 
    return () => clearInterval(interval);
  }, [search]);

  return (
    <DashboardLayout title="Data Peserta" subtitle={eventTitle}>
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama/email peserta..."
          className="input-field max-w-sm"
        />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-700/50 border-b border-ink-700/10 bg-brand-50/50">
              <th className="p-3 font-medium">Nama</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Kode Registrasi</th>
              <th className="p-3 font-medium">Email Terkirim</th>
              <th className="p-3 font-medium">Status Kehadiran</th>
              <th className="p-3 font-medium">Waktu Check-in</th>
            </tr>
          </thead>
          <tbody>
            {registrations.map((r) => (
              <tr key={r.id} className="border-b border-ink-700/5 last:border-0">
                <td className="p-3">{r.user.fullname}</td>
                <td className="p-3">{r.user.email}</td>
                <td className="p-3 font-mono text-xs">{r.qrCode}</td>
                <td className="p-3">
                  <span className={`badge ${r.emailSent ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                    {r.emailSent ? 'Terkirim' : 'Gagal'}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`badge ${r.attendance ? 'bg-success/10 text-success' : 'bg-ink-700/10 text-ink-700/50'}`}>
                    {r.attendance ? 'Hadir' : 'Belum Hadir'}
                  </span>
                </td>
                <td className="p-3 text-xs text-ink-700/60">
                  {r.attendance?.checkInTime ? new Date(r.attendance.checkInTime).toLocaleString('id-ID') : '-'}
                </td>
              </tr>
            ))}
            {registrations.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-ink-700/40">Belum ada pendaftar.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
