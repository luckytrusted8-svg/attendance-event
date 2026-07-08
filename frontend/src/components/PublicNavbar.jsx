import { Link } from 'react-router-dom';

export default function PublicNavbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-lg font-extrabold tracking-tight text-slate-900">
          Event<span className="text-blue-600">Digital</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="/#ongoing" className="hover:text-slate-900 transition-colors">Berlangsung</a>
          <a href="/#upcoming" className="hover:text-slate-900 transition-colors">Akan Datang</a>
          <a href="/#finished" className="hover:text-slate-900 transition-colors">Selesai</a>
        </nav>

        <Link
          to="/admin/login"
          className="text-sm font-semibold px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Login Admin
        </Link>
      </div>
    </header>
  );
}
