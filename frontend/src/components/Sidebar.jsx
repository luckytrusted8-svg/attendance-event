import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const iconClass = 'w-4 h-4';

// Menu Admin Level 1: akses penuh (event, laporan, data pengguna, admin, role)
const level1Menu = [
  { to: '/admin/dashboard', label: 'Dashboard', key: 'grid' },
  { to: '/admin/events', label: 'Kelola Event', key: 'calendar' },
  { to: '/admin/scanner', label: 'Scanner Kehadiran', key: 'scan' },
  { to: '/admin/users', label: 'Data Peserta', key: 'users' },
  { to: '/admin/admins', label: 'Manajemen Admin', key: 'shield' },
  { to: '/admin/roles', label: 'Role', key: 'key' },
  { to: '/admin/reports', label: 'Laporan', key: 'chart' },
  { to: '/admin/email-logs', label: 'Log Email', key: 'mail' },
  { to: '/admin/profile', label: 'Profil', key: 'user' },
  { to: '/admin/settings', label: 'Pengaturan', key: 'settings' },
];

// Menu Admin Level 2 (lapangan): hanya scanner & kehadiran
const level2Menu = [
  { to: '/admin/scanner', label: 'Scanner Kehadiran', key: 'scan' },
  { to: '/admin/profile', label: 'Profil', key: 'user' },
  { to: '/admin/settings', label: 'Pengaturan', key: 'settings' },
];

export default function Sidebar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const menu = admin?.role === 'Admin Level 1' ? level1Menu : level2Menu;

  function handleLogout() {
    logout();
    navigate('/admin/login');
  }

  return (
    <aside className="w-64 shrink-0 bg-ink-950 text-white flex flex-col h-screen sticky top-0">
      <div className="px-5 py-6 border-b border-white/10">
        <p className="font-display text-lg leading-tight">Event & Kehadiran</p>
        <p className="text-[11px] tracking-wide uppercase text-white/40 mt-1">Digital Platform</p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-brand-600 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs text-white/50 truncate">{admin?.fullname}</p>
        <p className="text-[11px] text-white/30 truncate mb-3">{admin?.role}</p>
        <button
          onClick={handleLogout}
          className="w-full text-sm bg-white/5 hover:bg-white/10 text-white/80 rounded-md py-2 transition-colors"
        >
          Keluar
        </button>
      </div>
    </aside>
  );
}
