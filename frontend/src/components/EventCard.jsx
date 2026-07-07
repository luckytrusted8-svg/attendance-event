import { Link } from 'react-router-dom';

const phaseLabel = {
  ongoing: 'Sedang Berlangsung',
  upcoming: 'Akan Datang',
  finished: 'Telah Berakhir',
};

const phaseColor = {
  ongoing: 'bg-success/10 text-success',
  upcoming: 'bg-brand-500/10 text-brand-600',
  finished: 'bg-ink-700/10 text-ink-700/60',
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatTime(timeStr) {
  const d = new Date(timeStr);
  return d.toISOString().slice(11, 16);
}

export default function EventCard({ event }) {
  return (
    <Link
      to={`/events/${event.id}`}
      className="card overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="h-36 bg-ink-700/5 flex items-center justify-center overflow-hidden">
        {event.imageUrl ? (
          <img src={event.imageUrl} alt={event.title} className="w-full h-full object-cover" />
        ) : (
          <span className="font-display text-3xl text-ink-700/20">Ev</span>
        )}
      </div>
      <div className="p-4 flex flex-col gap-2 flex-1">
        <span className={`badge w-fit ${phaseColor[event.phase] || phaseColor.upcoming}`}>
          {phaseLabel[event.phase] || event.phase}
        </span>
        <h3 className="font-display text-base leading-snug text-ink-900">{event.title}</h3>
        <p className="text-xs text-ink-700/60">{event.location || 'Lokasi belum ditentukan'}</p>
        <p className="text-xs text-ink-700/60">
          {formatDate(event.eventDate)} · {formatTime(event.startTime)}–{formatTime(event.endTime)}
        </p>
        <div className="mt-auto pt-2 text-xs text-brand-600 font-medium">
          {event.totalRegistrations ?? 0} pendaftar
        </div>
      </div>
    </Link>
  );
}
