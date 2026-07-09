import { Link } from 'react-router-dom';

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTime(timeStr) {
  return new Date(timeStr).toISOString().slice(11, 16);
}

const badgeByPhase = {
  ongoing: (
    <span className="inline-flex items-center gap-1.5 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
    </span>
  ),
  upcoming: (
    <span className="bg-slate-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full">Segera</span>
  ),
  finished: (
    <span className="bg-slate-200 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">Selesai</span>
  ),
};

const ctaByPhase = {
  ongoing: 'Gabung Sekarang',
  upcoming: 'Lihat Detail',
  finished: 'Lihat Ringkasan',
};

export default function EventCard({ event }) {
  const isFinished = event.phase === 'finished';

  return (
    <Link
      to={`/events/${event.id}`}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
    >
      <div className="relative h-40 bg-slate-100 overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className={`w-full h-full object-cover ${isFinished ? 'grayscale-[40%] opacity-80' : ''}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300 font-extrabold text-3xl">
            {event.title?.charAt(0) || 'E'}
          </div>
        )}
        <div className="absolute top-3 left-3">{badgeByPhase[event.phase]}</div>
        <div className="absolute top-3 right-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${event.isPaid ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
            {event.isPaid ? `Rp ${Number(event.price || 0).toLocaleString('id-ID')}` : 'Gratis'}
          </span>
        </div>
      </div>

      <div className="p-5 flex flex-col gap-2 flex-1">
        {event.category && (
          <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide w-fit">{event.category}</span>
        )}
        <h3 className="font-bold text-slate-900 leading-snug line-clamp-2">{event.title}</h3>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          📍 {event.isOnline ? 'Online Event' : (event.location || 'Lokasi menyusul')}
        </p>
        <p className="text-xs text-slate-500 flex items-center gap-1">
          🗓 {formatDate(event.eventDate)} · {formatTime(event.startTime)}–{formatTime(event.endTime)}
        </p>

        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="text-xs text-slate-400">{event.totalRegistrations ?? 0} pendaftar</span>
          <span className="text-sm font-semibold text-blue-600 group-hover:translate-x-0.5 transition-transform">
            {ctaByPhase[event.phase]} →
          </span>
        </div>
      </div>
    </Link>
  );
}