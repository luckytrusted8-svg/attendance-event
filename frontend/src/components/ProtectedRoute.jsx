import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Membatasi akses halaman berdasarkan status login & role admin yang diizinkan
export default function ProtectedRoute({ children, allowedRoles }) {
  const { admin } = useAuth();

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(admin.role)) {
    return (
      <div className="flex items-center justify-center h-full py-24">
        <div className="text-center">
          <p className="font-display text-2xl text-ink-900 mb-2">Akses Ditolak</p>
          <p className="text-ink-700/70 text-sm">Halaman ini tidak tersedia untuk role Anda ({admin.role}).</p>
        </div>
      </div>
    );
  }

  return children;
}
