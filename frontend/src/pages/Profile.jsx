import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';

export default function Profile() {
  const { admin } = useAuth();

  return (
    <DashboardLayout title="Profil" subtitle="Informasi akun admin yang sedang login.">
      <div className="card p-6 max-w-md">
        <div className="w-16 h-16 rounded-full bg-brand-600 text-white flex items-center justify-center font-display text-2xl mb-4">
          {admin?.fullname?.charAt(0)}
        </div>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-ink-700/50">Nama Lengkap</dt>
            <dd className="text-ink-900 font-medium">{admin?.fullname}</dd>
          </div>
          <div>
            <dt className="text-ink-700/50">Email</dt>
            <dd className="text-ink-900 font-medium">{admin?.email}</dd>
          </div>
          <div>
            <dt className="text-ink-700/50">Role</dt>
            <dd><span className="badge bg-brand-500/10 text-brand-600">{admin?.role}</span></dd>
          </div>
        </dl>
        <p className="text-xs text-ink-700/40 mt-6">
          Untuk mengganti password, hubungi Admin Level 1 / pengelola sistem (reset dilakukan secara manual).
        </p>
      </div>
    </DashboardLayout>
  );
}
