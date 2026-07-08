export default function PublicFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-3 gap-8">
        <div>
          <p className="text-lg font-extrabold tracking-tight text-white mb-2">
            Event<span className="text-blue-400">Digital</span>
          </p>
          <p className="text-sm text-slate-400 max-w-xs">
            Registrasi event dan verifikasi kehadiran berbasis QR Code cepat, akurat, tanpa kertas.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-3">Platform</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="/#ongoing" className="hover:text-white transition-colors">Event Berlangsung</a></li>
            <li><a href="/#upcoming" className="hover:text-white transition-colors">Event Akan Datang</a></li>
            <li><a href="/#finished" className="hover:text-white transition-colors">Event Selesai</a></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white mb-3">Panitia</p>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="/admin/login" className="hover:text-white transition-colors">Login Admin</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-800 py-5 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} EventDigital. Sistem Manajemen Event & Kehadiran Digital.
      </div>
    </footer>
  );
}
