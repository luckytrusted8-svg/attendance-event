export default function StatCard({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="text-xs uppercase tracking-wide text-ink-700/50 font-medium mb-2">{label}</p>
      <p className="font-display text-3xl text-ink-900">{value}</p>
      {hint && <p className="text-xs text-ink-700/50 mt-1">{hint}</p>}
    </div>
  );
}
