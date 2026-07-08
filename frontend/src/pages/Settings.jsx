import { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

const PRESETS = ['#0F1720', '#16212C', '#2C5A7C', '#193B54', '#1E2E3B'];

export default function Settings() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [color, setColor] = useState(PRESETS[0]);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.get('/events').then((res) => setEvents(res.data.data));
  }, []);

  async function handleSave() {
    if (!selectedEvent) return;
    await api.patch(`/events/${selectedEvent}/background`, { bannerBg: color });
    localStorage.setItem('scanner_bg', color);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <DashboardLayout title="Pengaturan" subtitle="Sesuaikan latar belakang halaman Scanner per perangkat.">
      <div className="card p-6 max-w-md space-y-4">
        <div>
          <label className="label-field">Event</label>
          <select className="input-field" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
            <option value="">-- Pilih Event --</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-field">Warna Latar Scanner</label>
          <div className="flex gap-2">
            {PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-9 h-9 rounded-md border-2 ${color === c ? 'border-accent-500' : 'border-transparent'}`}
              />
            ))}
          </div>
        </div>
        <button onClick={handleSave} className="btn-primary w-full">Simpan Pengaturan</button>
        {saved && <p className="text-sm text-success">Pengaturan berhasil disimpan.</p>}
        <p className="text-xs text-ink-700/40 pt-2 border-t border-ink-700/10">
          Pengaturan lanjutan (notifikasi, backup data) direncanakan pada versi mendatang.
        </p>
      </div>
    </DashboardLayout>
  );
}
