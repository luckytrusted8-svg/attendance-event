import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Topbar() {
  const { admin } = useAuth();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function handleSearch(e) {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/admin/events?search=${encodeURIComponent(query.trim())}`);
  }

  const initials = admin?.fullname
    ?.split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center justify-between gap-4">
      <form onSubmit={handleSearch} className="relative w-full max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari event..."
          className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-slate-100 border border-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-slate-200 transition-colors"
        />
      </form>

      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-900 leading-tight">{admin?.fullname}</p>
          <p className="text-[11px] text-slate-400 uppercase tracking-wide">{admin?.role}</p>
        </div>
        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
          {initials || 'AD'}
        </div>
      </div>
    </div>
  );
}