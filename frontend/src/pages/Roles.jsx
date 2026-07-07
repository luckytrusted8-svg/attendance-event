import { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

export default function Roles() {
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    api.get('/auth/roles').then((res) => setRoles(res.data.data));
  }, []);

  return (
    <DashboardLayout title="Role" subtitle="Deskripsi peran admin dan jumlah admin per role.">
      <div className="grid md:grid-cols-2 gap-5">
        {roles.map((r) => (
          <div key={r.id} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display text-lg text-ink-900">{r.name}</h3>
              <span className="badge bg-brand-500/10 text-brand-600">{r.totalAdmins} admin</span>
            </div>
            <p className="text-sm text-ink-700/60">{r.description}</p>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
