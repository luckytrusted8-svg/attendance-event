import { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');

  async function fetchUsers() {
    const res = await api.get('/users', { params: { search } });
    setUsers(res.data.data);
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <DashboardLayout title="Data Peserta" subtitle="Seluruh peserta terdaftar lintas event.">
      <div className="mb-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nama/email..." className="input-field max-w-sm" />
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-700/50 border-b border-ink-700/10 bg-brand-50/50">
              <th className="p-3 font-medium">Nama</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Telepon</th>
              <th className="p-3 font-medium">Institusi</th>
              <th className="p-3 font-medium text-right">Total Registrasi</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-ink-700/5 last:border-0">
                <td className="p-3">{u.fullname}</td>
                <td className="p-3">{u.email}</td>
                <td className="p-3">{u.phone || '-'}</td>
                <td className="p-3">{u.institution || '-'}</td>
                <td className="p-3 text-right">{u.totalRegistrations}</td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-ink-700/40">Belum ada peserta.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardLayout>
  );
}
