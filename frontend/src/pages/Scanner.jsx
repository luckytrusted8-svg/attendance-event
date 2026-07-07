import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

export default function Scanner() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState(null);
  const [mode, setMode] = useState('qr'); // qr | manual
  const [keyword, setKeyword] = useState('');
  const [manualResults, setManualResults] = useState([]);
  const scannerRef = useRef(null);
  const regionId = 'qr-reader-region';

  useEffect(() => {
    api.get('/events').then((res) => setEvents(res.data.data));
  }, []);

  useEffect(() => {
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startScanner() {
    if (!selectedEvent) {
      setMessage({ type: 'error', text: 'Pilih event yang berlangsung terlebih dahulu.' });
      return;
    }
    setScanning(true);
    const html5QrCode = new Html5Qrcode(regionId);
    scannerRef.current = html5QrCode;
    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        async (decodedText) => {
          await handleScanResult(decodedText);
        },
        () => {}
      );
    } catch (err) {
      setMessage({ type: 'error', text: 'Tidak dapat mengakses kamera. Periksa izin kamera perangkat.' });
      setScanning(false);
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {
        /* ignore */
      }
    }
    setScanning(false);
  }

  async function handleScanResult(qrCode) {
    // Cegah scan berulang saat masih memproses hasil sebelumnya
    if (message?.processing) return;
    setMessage({ processing: true });
    try {
      const res = await api.post('/attendance/scan', { qrCode });
      setMessage({ type: 'success', text: res.data.message });
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'QR Code tidak dikenali.' });
    }
  }

  async function handleManualSearch(e) {
    e.preventDefault();
    if (!selectedEvent || !keyword) return;
    // Karena tidak ada endpoint search langsung, gunakan check-in manual by keyword pada backend
    try {
      const res = await api.post('/attendance/manual', { eventId: selectedEvent, keyword });
      setMessage({ type: 'success', text: res.data.message });
      setKeyword('');
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Peserta tidak ditemukan.' });
    }
  }

  return (
    <DashboardLayout title="Scanner Kehadiran" subtitle="Pindai QR Code peserta atau gunakan pencarian manual sebagai cadangan.">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="card p-5">
          <label className="label-field">Pilih Event yang Berlangsung</label>
          <select className="input-field mb-4" value={selectedEvent} onChange={(e) => setSelectedEvent(e.target.value)}>
            <option value="">-- Pilih Event --</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title} ({e.phase})</option>
            ))}
          </select>

          <div className="flex gap-2 mb-4">
            <button onClick={() => setMode('qr')} className={`flex-1 text-sm py-2 rounded-md ${mode === 'qr' ? 'bg-brand-600 text-white' : 'bg-white border border-ink-700/10'}`}>Scan QR</button>
            <button onClick={() => setMode('manual')} className={`flex-1 text-sm py-2 rounded-md ${mode === 'manual' ? 'bg-brand-600 text-white' : 'bg-white border border-ink-700/10'}`}>Cari Manual</button>
          </div>

          {mode === 'qr' ? (
            <div>
              <div id={regionId} className="rounded-md overflow-hidden bg-ink-950 min-h-[240px]" />
              <div className="mt-3">
                {!scanning ? (
                  <button onClick={startScanner} className="btn-primary w-full">Mulai Scan</button>
                ) : (
                  <button onClick={stopScanner} className="btn-secondary w-full">Hentikan Scan</button>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleManualSearch} className="space-y-3">
              <label className="label-field">Nama / Email Peserta</label>
              <input className="input-field" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="cth: Budi atau budi@email.com" />
              <button type="submit" className="btn-primary w-full">Cari & Catat Hadir</button>
            </form>
          )}
        </div>

        <div className="card p-5">
          <h2 className="font-display text-lg text-ink-900 mb-4">Hasil Verifikasi</h2>
          {message ? (
            message.processing ? (
              <p className="text-sm text-ink-700/50">Memproses...</p>
            ) : (
              <div className={`p-4 rounded-md text-sm ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                {message.text}
              </div>
            )
          ) : (
            <p className="text-sm text-ink-700/40">Belum ada aktivitas pemindaian.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
