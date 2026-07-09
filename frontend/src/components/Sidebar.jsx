import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Calendar, ScanLine, Users, ShieldCheck, KeyRound,
  BarChart3, Mail, User, Settings, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const level1Menu = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/admin/events', label: 'Kelola Event', icon: Calendar },
  { to: '/admin/scanner', label: 'Scanner Kehadiran', icon: ScanLine },
  { to: '/admin/users', label: 'Data Peserta', icon: Users },
  { to: '/admin/admins', label: 'Manajemen Admin', icon: ShieldCheck },
  { to: '/admin/roles', label: 'Role', icon: KeyRound },
  { to: '/admin/reports', label: 'Laporan', icon: BarChart3 },
  { to: '/admin/email-logs', label: 'Log Email', icon: Mail },
];

const bottomMenu = [
  { to: '/admin/profile', label: 'Profil', icon: User },
  { to: '/admin/settings', label: 'Pengaturan', icon: Settings },
];

const level2Menu = [
  { to: '/admin/scanner', label: 'Scanner Kehadiran', icon: ScanLine },
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
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen sticky top-0 print:hidden">
      <div className="px-5 py-6">
        <p className="text-lg font-extrabold tracking-tight text-slate-900">
          Event<span className="text-blue-600">Digital</span>
        </p>
        <p className="text-xs text-slate-400 mt-0.5">Admin Dashboard</p>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {menu.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`
              }
            >
              <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
              {item.label}
            </NavLink>
          );
        })}

        <div className="pt-4 mt-4 border-t border-slate-100 space-y-1">
          {bottomMenu.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                  }`
                }
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <div className="p-3">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2} />
          Keluar
        </button>
      </div>
    </aside>
  );
}