import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/admin', { email, password });
      const { token, admin } = res.data.data;
      login(token, admin);
      navigate(admin.role === 'Admin Level 2' ? '/admin/scanner' : '/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 relative overflow-hidden flex items-center justify-center p-4">
      
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-200/60" />
      <div className="absolute -bottom-32 -right-10 w-72 h-72 rounded-full bg-indigo-300/50" />
      <div className="absolute bottom-10 right-1/3 w-4 h-4 rounded-full bg-indigo-300" />

      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">
      
        <div className="relative hidden md:flex flex-col justify-center gap-5 p-12 bg-indigo-500 text-white overflow-hidden">
      
          <div className="absolute top-10 left-10 w-8 h-8 rounded-full border-2 border-white/50" />
          <div className="absolute top-16 left-24 w-2 h-2 rounded-full bg-teal-300" />
          <div
            className="absolute top-8 left-40 w-24 h-16 opacity-70"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1.5px, transparent 1.5px)', backgroundSize: '10px 10px' }}
          />
          <div className="absolute top-6 left-52 w-5 h-24 rounded-full bg-white/25 rotate-6" />
          <div className="absolute top-14 left-60 w-5 h-16 rounded-full bg-white/15 -rotate-6" />

      
          <div className="relative z-10 mt-16">
            <h1 className="text-5xl font-extrabold leading-tight mb-4">
              Kehadiran<br />jadi mudah.
            </h1>
            <p className="text-indigo-100/90 text-sm leading-relaxed max-w-xs">
              Masuk untuk mengatur event, memantau kehadiran peserta lewat QR Code, dan mengelola tim admin Anda.
            </p>
          </div>

          
          <div className="absolute bottom-16 left-10 w-3 h-3 rounded-full bg-teal-300" />
          <div
            className="absolute bottom-6 left-8 w-16 h-14 opacity-60"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.6) 1.5px, transparent 1.5px)', backgroundSize: '9px 9px' }}
          />
          <div className="absolute bottom-10 left-32 w-6 h-6 flex items-center justify-center text-white/60 text-lg font-bold">×</div>
          <div className="absolute -bottom-16 right-0 w-56 h-56 rounded-full border-2 border-white/40" />
          <div className="absolute -bottom-24 right-8 w-40 h-40 rounded-full bg-gradient-to-tr from-teal-300 to-teal-100" />
          <div className="absolute -bottom-4 right-16 w-4 h-4 rounded-full bg-teal-200" />
        </div>

        {/* Right panel */}
        <div className="relative bg-slate-50 p-8 sm:p-12 flex flex-col justify-center">
          <Link to="/" className="absolute top-6 left-6 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
            <svg viewBox="0 0 24 24" fill="none" width="13" height="13">
              <path d="M19 12H5M11 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Beranda
          </Link>

          <div className="w-14 h-14 rounded-2xl bg-white shadow-md flex items-center justify-center mx-auto mb-5 overflow-hidden">
            <img 
              src="/Logo.png" 
              alt="Logo" 
              className="w-full h-full object-contain" 
            />
          </div>

          <h2 className="text-lg text-center text-slate-700 mb-8">
            Halo! <span className="font-semibold text-slate-900">Selamat Datang Kembali</span>
          </h2>

          <form onSubmit={handleSubmit} className="max-w-sm w-full mx-auto space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <path d="M3 6h18v12H3z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                    <path d="M3 6l9 7 9-7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                  </svg>
                </span>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contoh@event.com"
                  className="w-full pl-10 pr-3 py-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1.5">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">
                  <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                    <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M8 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </span>
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                      <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.7 9.7 0 0112 5c5 0 9 4 10 7-.4 1.1-1 2.2-1.9 3.2M6.2 6.2C4.3 7.5 2.9 9.4 2 12c1 3 5 7 10 7 1.3 0 2.5-.2 3.6-.7"
                        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-500 focus:ring-indigo-400"
                />
                Ingat Saya
              </label>
              <span
                className="text-sm text-indigo-500 cursor-default"
                title="Reset password dilakukan manual oleh Admin Level 1"
              >
                Lupa Password?
              </span>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 disabled:opacity-60 text-white text-sm font-semibold transition-colors shadow-sm"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>

            <div className="pt-2 text-center">
              <div className="h-px bg-slate-200 mb-4" />
              <p className="text-sm text-slate-500">
                Butuh akun? <span className="text-indigo-500 font-medium">Hubungi Admin Level 1</span>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}