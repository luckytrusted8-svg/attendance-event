import { useEffect, useState } from 'react';
import api from '../api/axios';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';

export default function EmailLogs() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [eventFilter, setEventFilter] = useState('');
  const [sortBy, setSortBy] = useState('latest');
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    perPage: 10,
    total: 0
  });

  async function fetchEvents() {
    try {
      const res = await api.get('/events', { params: { limit: 100 } });
      setEvents(res.data.data || []);
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  }

  async function fetchData(page = 1) {
    setLoading(true);
    try {
      const params = {
        page,
        limit: pagination.perPage,
        status: statusFilter || undefined,
        search: search || undefined,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
        eventId: eventFilter || undefined,
        sort: sortBy || undefined
      };

      const [logsRes, statsRes] = await Promise.all([
        api.get('/notifications/email-logs', { params }),
        api.get('/notifications/email-logs/stats'),
      ]);

      setLogs(logsRes.data.data);
      setStats(statsRes.data.data);
      
      // Update pagination info
      if (logsRes.data.pagination) {
        setPagination({
          currentPage: logsRes.data.pagination.currentPage || page,
          totalPages: logsRes.data.pagination.totalPages || 1,
          perPage: logsRes.data.pagination.perPage || 10,
          total: logsRes.data.pagination.total || 0
        });
      }
    } catch (err) {
      console.error('Error fetching email logs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEvents();
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, search, dateRange, eventFilter, sortBy]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        fetchData(1);
      }
    }, 500);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Reset all filters
  function resetFilters() {
    setSearch('');
    setStatusFilter('');
    setDateRange({ start: '', end: '' });
    setEventFilter('');
    setSortBy('latest');
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }

  // Handle page change
  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchData(newPage);
    }
  }

  // Format date for display
  function formatDate(dateString) {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  }

  // Get status badge class
  function getStatusBadge(status) {
    switch(status) {
      case 'sent':
        return 'bg-success/10 text-success';
      case 'failed':
        return 'bg-danger/10 text-danger';
      case 'pending':
        return 'bg-warning/10 text-warning';
      default:
        return 'bg-ink-700/10 text-ink-700/60';
    }
  }

  // Get status label
  function getStatusLabel(status) {
    switch(status) {
      case 'sent':
        return '✅ Terkirim';
      case 'failed':
        return '❌ Gagal';
      case 'pending':
        return '⏳ Pending';
      default:
        return status || 'Tidak diketahui';
    }
  }

  // Generate pagination buttons
  function renderPaginationButtons() {
    const buttons = [];
    const { currentPage, totalPages } = pagination;
    
    if (totalPages <= 1) return buttons;

    // Previous button
    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1.5 rounded-md text-sm border border-ink-700/10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ink-700/5 transition-colors"
      >
        ← Prev
      </button>
    );

    // Page numbers
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <button
          key={1}
          onClick={() => handlePageChange(1)}
          className="px-3 py-1.5 rounded-md text-sm hover:bg-ink-700/5 transition-colors"
        >
          1
        </button>
      );
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="px-2 text-ink-700/40">...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
            i === currentPage 
              ? 'bg-brand-600 text-white' 
              : 'hover:bg-ink-700/5'
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className="px-2 text-ink-700/40">...</span>);
      }
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="px-3 py-1.5 rounded-md text-sm hover:bg-ink-700/5 transition-colors"
        >
          {totalPages}
        </button>
      );
    }

    // Next button
    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1.5 rounded-md text-sm border border-ink-700/10 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-ink-700/5 transition-colors"
      >
        Next →
      </button>
    );

    return buttons;
  }

  // Get search placeholder text
  function getSearchPlaceholder() {
    const fields = ['Nama', 'Email', 'Event'];
    return `🔍 Cari ${fields.join(', ')}...`;
  }

  return (
    <DashboardLayout title="Log Email" subtitle="Riwayat pengiriman QR Code ke peserta.">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard label="Total Terkirim" value={stats.total} icon="📧" />
          <StatCard label="Berhasil" value={stats.sent} icon="✅" />
          <StatCard label="Gagal" value={stats.failed || 0} icon="❌" />
          <StatCard label="Success Rate" value={`${stats.successRate || 0}%`} icon="📊" />
        </div>
      )}

      {/* Filter Section */}
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <input
                type="text"
                placeholder={getSearchPlaceholder()}
                className="input-field pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-700/40">🔍</span>
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-700/40 hover:text-ink-700"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="text-xs text-ink-700/40 mt-1">
              💡 Cari berdasarkan nama peserta, email, atau judul event
            </div>
          </div>

          {/* Event Filter */}
          <select
            className="input-field w-auto min-w-[160px]"
            value={eventFilter}
            onChange={(e) => setEventFilter(e.target.value)}
          >
            <option value="">📋 Semua Event</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            className="input-field w-auto min-w-[140px]"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">📊 Semua Status</option>
            <option value="sent">✅ Terkirim</option>
            <option value="failed">❌ Gagal</option>
            <option value="pending">⏳ Pending</option>
          </select>

          {/* Sort By */}
          <select
            className="input-field w-auto min-w-[140px]"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="latest">🕐 Terbaru</option>
            <option value="oldest">🕐 Terlama</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Date Range */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              className="input-field w-auto"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              placeholder="Dari"
            />
            <span className="text-ink-700/40">-</span>
            <input
              type="date"
              className="input-field w-auto"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              placeholder="Sampai"
            />
          </div>

          {/* Reset Button */}
          {(search || statusFilter || dateRange.start || dateRange.end || eventFilter || sortBy !== 'latest') && (
            <button
              onClick={resetFilters}
              className="btn-secondary whitespace-nowrap"
            >
              Reset Filter
            </button>
          )}
        </div>

        {/* Active Filters Info */}
        {(search || statusFilter || dateRange.start || dateRange.end || eventFilter || sortBy !== 'latest') && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-sm text-ink-700/50">Filter aktif:</span>
            {search && (
              <span className="badge bg-brand-50 text-brand-600">
                🔍 {search}
                <button
                  onClick={() => setSearch('')}
                  className="ml-1 hover:text-brand-800"
                >
                  ✕
                </button>
              </span>
            )}
            {eventFilter && events.find(e => e.id === parseInt(eventFilter)) && (
              <span className="badge bg-brand-50 text-brand-600">
                📋 {events.find(e => e.id === parseInt(eventFilter))?.title}
                <button
                  onClick={() => setEventFilter('')}
                  className="ml-1 hover:text-brand-800"
                >
                  ✕
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="badge bg-brand-50 text-brand-600">
                📊 {statusFilter === 'sent' ? 'Terkirim' : statusFilter === 'failed' ? 'Gagal' : 'Pending'}
                <button
                  onClick={() => setStatusFilter('')}
                  className="ml-1 hover:text-brand-800"
                >
                  ✕
                </button>
              </span>
            )}
            {dateRange.start && (
              <span className="badge bg-brand-50 text-brand-600">
                📅 Dari: {new Date(dateRange.start).toLocaleDateString('id-ID')}
                <button
                  onClick={() => setDateRange({ ...dateRange, start: '' })}
                  className="ml-1 hover:text-brand-800"
                >
                  ✕
                </button>
              </span>
            )}
            {dateRange.end && (
              <span className="badge bg-brand-50 text-brand-600">
                📅 Sampai: {new Date(dateRange.end).toLocaleDateString('id-ID')}
                <button
                  onClick={() => setDateRange({ ...dateRange, end: '' })}
                  className="ml-1 hover:text-brand-800"
                >
                  ✕
                </button>
              </span>
            )}
            {sortBy !== 'latest' && (
              <span className="badge bg-brand-50 text-brand-600">
                🕐 {sortBy === 'oldest' ? 'Terlama' : 'Terbaru'}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
            <p className="ml-3 text-ink-700/60">Memuat log email...</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-ink-700/50 border-b border-ink-700/10 bg-brand-50/50">
                  <th className="p-3 font-medium">Penerima</th>
                  <th className="p-3 font-medium">Event</th>
                  <th className="p-3 font-medium">Subjek</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Waktu</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b border-ink-700/5 last:border-0 hover:bg-ink-700/5 transition-colors">
                    <td className="p-3">
                      <div className="font-medium text-ink-900">{l.recipientName || '-'}</div>
                      <div className="text-xs text-ink-700/40">{l.recipientEmail}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-ink-900">{l.eventTitle || '-'}</div>
                      {l.eventDate && (
                        <div className="text-xs text-ink-700/40">
                          📅 {new Date(l.eventDate).toLocaleDateString('id-ID')}
                        </div>
                      )}
                    </td>
                    <td className="p-3 max-w-[200px] truncate" title={l.subject}>
                      {l.subject || '-'}
                    </td>
                    <td className="p-3">
                      <span className={`badge ${getStatusBadge(l.status)}`}>
                        {getStatusLabel(l.status)}
                      </span>
                      {l.errorMessage && (
                        <div className="text-xs text-danger mt-1 max-w-[150px] truncate" title={l.errorMessage}>
                          {l.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="p-3 text-xs text-ink-700/60">
                      {formatDate(l.sentAt)}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-ink-700/40">
                      {search || statusFilter || dateRange.start || dateRange.end || eventFilter ? (
                        <>
                          <p className="text-4xl mb-2">🔍</p>
                          <p>Tidak ada log email dengan filter yang dipilih</p>
                          <button 
                            onClick={resetFilters}
                            className="btn-secondary text-sm mt-3"
                          >
                            Reset Filter
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-4xl mb-2">📧</p>
                          <p>Belum ada log email.</p>
                        </>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {logs.length > 0 && (
              <div className="p-3 border-t border-ink-700/10">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-sm text-ink-700/50">
                    Menampilkan {pagination.total > 0 ? ((pagination.currentPage - 1) * pagination.perPage) + 1 : 0} -{' '}
                    {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} dari{' '}
                    {pagination.total} data
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
                    {renderPaginationButtons()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}