import { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statistics, setStatistics] = useState({
    total: 0,
    hadir: 0,
    belumHadir: 0,
    eventDiikuti: 0
  });
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get('/users', { params: { search } });
      const userData = res.data.data || [];
      setUsers(userData);
      updateStatistics(userData);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }

  // Update statistik berdasarkan data user
  function updateStatistics(userData) {
    const stats = {
      total: userData.length,
      hadir: 0,
      belumHadir: 0,
      eventDiikuti: 0
    };

    userData.forEach(user => {
      // Hitung user yang sudah hadir (checked in) minimal 1 event
      if (user.totalCheckIns && user.totalCheckIns > 0) {
        stats.hadir++;
      } else {
        stats.belumHadir++;
      }
      
      // Akumulasi total event yang diikuti oleh semua user
      stats.eventDiikuti += (user.totalRegistrations || 0);
    });

    setStatistics(stats);
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <DashboardLayout title="Data Peserta" subtitle="Seluruh peserta terdaftar lintas event.">
      {/* Statistik Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <p className="text-sm text-ink-700/60">Total Peserta</p>
          <p className="text-2xl font-display text-ink-900">{statistics.total.toLocaleString('id-ID')}</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-success">
          <p className="text-sm text-ink-700/60">Hadir Check In</p>
          <p className="text-2xl font-display text-success">{statistics.hadir.toLocaleString('id-ID')}</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-warning">
          <p className="text-sm text-ink-700/60">Belum Hadir</p>
          <p className="text-2xl font-display text-warning">{statistics.belumHadir.toLocaleString('id-ID')}</p>
        </div>
        <div className="card p-4 text-center border-l-4 border-primary">
          <p className="text-sm text-ink-700/60">Event Diikuti</p>
          <p className="text-2xl font-display text-primary">{statistics.eventDiikuti.toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="🔍 Cari nama/email..." 
            className="input-field pl-10" 
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40">🔍</span>
        </div>
        {search && (
          <p className="text-sm text-ink-700/50 mt-2">
            Menampilkan hasil untuk: <span className="font-medium text-ink-900">"{search}"</span>
          </p>
        )}
      </div>

      {/* Users Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-ink-700/40">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="mt-2">Memuat data peserta...</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-700/50 border-b border-ink-700/10 bg-brand-50/50">
                <th className="p-3 font-medium">Nama</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Telepon</th>
                <th className="p-3 font-medium">Institusi</th>
                <th className="p-3 font-medium text-center">Status</th>
                <th className="p-3 font-medium text-right">Total Registrasi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-ink-700/5 last:border-0 hover:bg-ink-700/5 transition-colors">
                  <td className="p-3 font-medium text-ink-900">{u.fullname}</td>
                  <td className="p-3 text-ink-700/80">{u.email}</td>
                  <td className="p-3">{u.phone || '-'}</td>
                  <td className="p-3">{u.institution || '-'}</td>
                  <td className="p-3 text-center">
                    {u.totalCheckIns && u.totalCheckIns > 0 ? (
                      <span className="badge bg-success/10 text-success">
                        ✅ Hadir
                      </span>
                    ) : (
                      <span className="badge bg-warning/10 text-warning">
                        ⏳ Belum Hadir
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <span className="font-medium">{u.totalRegistrations || 0}</span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-ink-700/40">
                    {search ? 'Tidak ada peserta dengan kata kunci tersebut.' : 'Belum ada peserta terdaftar.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        
        {/* Footer with total count */}
        {!loading && users.length > 0 && (
          <div className="p-3 border-t border-ink-700/10 text-sm text-ink-700/50">
            Menampilkan {users.length} peserta
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}