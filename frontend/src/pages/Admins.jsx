import { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const emptyForm = { fullname: '', email: '', password: '', roleId: '' };

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function fetchData() {
    const [adminsRes, rolesRes] = await Promise.all([api.get('/admins'), api.get('/auth/roles')]);
    setAdmins(adminsRes.data.data);
    setRoles(rolesRes.data.data);
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/admins', form);
      setForm(emptyForm);
      setShowForm(false);
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal membuat admin.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardLayout title="Manajemen Admin" subtitle="Kelola akun admin dan penetapan role.">
      <div className="flex justify-end mb-5">
        <button onClick={() => setShowForm(true)} className="btn-primary">+ Tambah Admin</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-700/50 border-b border-ink-700/10 bg-brand-50/50">
              <th className="p-3 font-medium">Nama</th>
              <th className="p-3 font-medium">Email</th>
              <th className="p-3 font-medium">Role</th>
              <th className="p-3 font-medium">Dibuat</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.id} className="border-b border-ink-700/5 last:border-0">
                <td className="p-3">{a.fullname}</td>
                <td className="p-3">{a.email}</td>
                <td className="p-3"><span className="badge bg-brand-500/10 text-brand-600">{a.role.name}</span></td>
                <td className="p-3 text-xs text-ink-700/50">{new Date(a.createdAt).toLocaleDateString('id-ID')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-ink-950/50 flex items-center justify-center z-50 px-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="font-display text-lg text-ink-900 mb-4">Tambah Admin Baru</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="label-field">Nama Lengkap</label>
                <input required className="input-field" value={form.fullname} onChange={(e) => setForm({ ...form, fullname: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Email</label>
                <input required type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Password</label>
                <input required minLength={6} type="password" className="input-field" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div>
                <label className="label-field">Role</label>
                <select required className="input-field" value={form.roleId} onChange={(e) => setForm({ ...form, roleId: e.target.value })}>
                  <option value="">-- Pilih Role --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-danger">{error}</p>}
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? 'Menyimpan...' : 'Simpan'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
