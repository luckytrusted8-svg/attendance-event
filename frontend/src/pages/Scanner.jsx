import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle2, XCircle, Printer, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';

function formatClock(date) {
  return new Date(date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function Scanner() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [eventDetail, setEventDetail] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null); // { status: 'success'|'error', message, participant, time }
  const [keyword, setKeyword] = useState('');
  const [feed, setFeed] = useState([]);
  const scannerRef = useRef(null);
  const regionId = 'qr-reader-region';

  useEffect(() => {
    api.get('/events').then((res) => setEvents(res.data.data));
  }, []);

  useEffect(() => {
    return () => stopScanner();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEventContext() {
    if (!selectedEvent) { setEventDetail(null); setFeed([]); return; }
    const [detailRes, feedRes] = await Promise.all([
      api.get(`/events/${selectedEvent}`),
      api.get(`/attendance/event/${selectedEvent}`),
    ]);
    setEventDetail(detailRes.data.data);
    setFeed(feedRes.data.data);
  }

  useEffect(() => {
    fetchEventContext();
    const interval = setInterval(fetchEventContext, 6000); // live feed polling
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedEvent]);

  async function startScanner() {
    if (!selectedEvent) {
      setResult({ status: 'error', message: 'Pilih event yang berlangsung terlebih dahulu.', time: new Date() });
      return;
    }
    setScanning(true);
    const html5QrCode = new Html5Qrcode(regionId);
    scannerRef.current = html5QrCode;
    try {
      await html5QrCode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 240 },
        async (decodedText) => { await handleScanResult(decodedText); },
        () => {}
      );
    } catch (err) {
      setResult({ status: 'error', message: 'Tidak dapat mengakses kamera. Periksa izin kamera perangkat.', time: new Date() });
      setScanning(false);
    }
  }

  async function stopScanner() {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); await scannerRef.current.clear(); } catch (e) { /* ignore */ }
    }
    setScanning(false);
  }

  async function handleScanResult(qrCode) {
    if (result?.processing) return;
    setResult({ processing: true });
    try {
      const res = await api.post('/attendance/scan', { qrCode });
      setResult({ status: 'success', message: res.data.message, participant: res.data.data.participant, time: new Date() });
      fetchEventContext();
    } catch (err) {
      setResult({ status: 'error', message: err.response?.data?.message || 'QR Code tidak dikenali.', time: new Date() });
    }
  }

  async function handleManualSearch(e) {
    e.preventDefault();
    if (!selectedEvent || !keyword) return;
    setResult({ processing: true });
    try {
      const res = await api.post('/attendance/manual', { eventId: selectedEvent, keyword });
      setResult({ status: 'success', message: res.data.message, participant: res.data.data.participant, time: new Date() });
      setKeyword('');
      fetchEventContext();
    } catch (err) {
      setResult({ status: 'error', message: err.response?.data?.message || 'Peserta tidak ditemukan.', time: new Date() });
    }
  }

  return (
    <DashboardLayout title="Scanner Kehadiran" subtitle="Pindai QR Code peserta atau gunakan pencarian manual sebagai cadangan.">
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left: scanner controls */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Pilih Event yang Sedang Berjalan</label>
            <div className="relative">
              <select
                value={selectedEvent}
                onChange={(e) => { setSelectedEvent(e.target.value); setResult(null); }}
                className="w-full appearance-none border border-slate-200 rounded-lg px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
              >
                <option value="">-- Pilih Event --</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>{e.title} ({e.phase === 'ongoing' ? 'Berlangsung' : e.phase === 'upcoming' ? 'Akan Datang' : 'Selesai'})</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Scanner QR Code</h2>
              <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${scanning ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${scanning ? 'bg-blue-600 animate-pulse' : 'bg-slate-400'}`} />
                {scanning ? 'Camera Active' : 'Kamera Nonaktif'}
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-square max-w-sm mx-auto">
              <div id={regionId} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
              {scanning && (
                <div className="pointer-events-none absolute inset-10 border-2 border-blue-400/0">
                  <span className="absolute -top-0.5 -left-0.5 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg" />
                  <span className="absolute -top-0.5 -right-0.5 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg" />
                  <span className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg" />
                </div>
              )}
              {!scanning && (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                  Kamera belum aktif
                </div>
              )}
            </div>

            <div className="mt-4">
              {!scanning ? (
                <button onClick={startScanner} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg text-sm transition-colors">Mulai Scan</button>
              ) : (
                <button onClick={stopScanner} className="w-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-3 rounded-lg text-sm transition-colors">Hentikan Scan</button>
              )}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-sm font-medium text-slate-700 mb-3">Gagal scan? Input ID atau Email secara manual:</p>
              <form onSubmit={handleManualSearch} className="flex flex-col sm:flex-row gap-2">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Contoh: REG-XXXX-XXXX atau budi@email.com"
                  className="flex-1 border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors">
                  Cek Kehadiran →
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right: result + live feed — sticky so it stays visible while scrolling */}
        <div className="space-y-5 print:hidden lg:sticky lg:top-24 lg:self-start z-10">
          {result && !result.processing && (
            <div className={`rounded-2xl border-2 p-5 ${result.status === 'success' ? 'border-emerald-400 bg-emerald-50/30' : 'border-red-400 bg-red-50/30'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {result.status === 'success' ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-500" />
                  )}
                  <div>
                    <p className={`text-sm font-bold ${result.status === 'success' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {result.status === 'success' ? 'Berhasil Check-in' : 'Gagal Check-in'}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">{formatClock(result.time)}</span>
              </div>

              {result.status === 'success' && result.participant ? (
                <>
                  <div className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wide">Nama Peserta</p>
                      <p className="font-bold text-slate-900 truncate">{result.participant.fullname}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">{result.participant.qrCode}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => window.print()} className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2.5 rounded-lg text-sm">
                      <Printer className="w-4 h-4" /> Print Tag
                    </button>
                    <button onClick={() => setResult(null)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm">
                      Selesai
                    </button>
                  </div>

                  {/* Printable tag — only visible when printing */}
                  <div className="hidden print:flex fixed inset-0 flex-col items-center justify-center gap-3 bg-white">
                    <p className="text-lg font-bold">{result.participant.fullname}</p>
                    <p className="text-sm text-slate-500">{eventDetail?.title}</p>
                    <p className="font-mono text-xs">{result.participant.qrCode}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-red-600">{result.message}</p>
              )}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Live Feed Kehadiran</h2>
              {eventDetail && (
                <span className="text-xs font-semibold text-slate-400">
                  Total: {feed.length}{eventDetail.capacity ? ` / ${eventDetail.capacity}` : ''}
                </span>
              )}
            </div>

            {!selectedEvent ? (
              <p className="text-sm text-slate-400 text-center py-8">Pilih event untuk melihat feed kehadiran.</p>
            ) : feed.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada kehadiran tercatat.</p>
            ) : (
              <ul className="space-y-3 max-h-96 overflow-y-auto">
                {feed.slice(0, 8).map((a) => (
                  <li key={a.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{a.fullname}</p>
                      <p className="text-xs text-slate-400 truncate">{a.qrCode} · {a.method === 'qr' ? 'QR Scan' : 'Manual'}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">{formatClock(a.checkInTime)}</span>
                  </li>
                ))}
              </ul>
            )}

            {selectedEvent && feed.length > 0 && (
              <Link to={`/admin/events/${selectedEvent}/participants`} className="mt-4 block text-center text-sm text-blue-600 font-medium hover:underline">
                Lihat Semua Kehadiran
              </Link>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}