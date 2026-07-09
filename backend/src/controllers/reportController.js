const prisma = require('../config/db');

/**
 * GET /api/reports
 * Halaman Laporan Analitik: rekap performa pendaftaran, kehadiran, dan estimasi pendapatan tiket per event.
 * Query opsional: ?days= (rentang tren registrasi harian, default 30)
 *
 * Catatan jujur: "Pendapatan" di sini adalah ESTIMASI (harga tiket × jumlah pendaftar event berbayar).
 * Sistem ini tidak memproses pembayaran sungguhan, jadi angka ini bukan pendapatan yang telah dikonfirmasi diterima.
 */
async function getReports(req, res) {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 30, 7), 90);

    const events = await prisma.event.findMany({
      include: { _count: { select: { registrations: true } } },
      orderBy: { eventDate: 'desc' },
    });

    const perEvent = await Promise.all(
      events.map(async (e) => {
        const totalAttended = await prisma.attendance.count({
          where: { registration: { eventId: e.id }, attendanceStatus: 'hadir' },
        });
        const totalRegistrations = e._count.registrations;
        const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;
        const revenue = e.isPaid && e.price ? e.price * totalRegistrations : 0;
        return {
          eventId: e.id,
          title: e.title,
          eventDate: e.eventDate,
          status: e.status,
          category: e.category,
          location: e.location,
          isPaid: e.isPaid,
          totalRegistrations,
          totalAttended,
          attendanceRate,
          revenue,
        };
      })
    );

    const totalEvents = events.length;
    const totalRegistrationsAll = perEvent.reduce((sum, e) => sum + e.totalRegistrations, 0);
    const totalAttendedAll = perEvent.reduce((sum, e) => sum + e.totalAttended, 0);
    const totalRevenue = perEvent.reduce((sum, e) => sum + e.revenue, 0);
    const overallAttendanceRate =
      totalRegistrationsAll > 0 ? Math.round((totalAttendedAll / totalRegistrationsAll) * 100) : 0;

    const mostPopular = [...perEvent].sort((a, b) => b.totalRegistrations - a.totalRegistrations)[0] || null;

    // Revenue per kategori (hanya event berbayar yang punya kontribusi)
    const revenueMap = {};
    perEvent.forEach((e) => {
      const key = e.category || 'Tanpa Kategori';
      revenueMap[key] = (revenueMap[key] || 0) + e.revenue;
    });
    const revenueByCategory = Object.entries(revenueMap)
      .filter(([, revenue]) => revenue > 0)
      .map(([category, revenue]) => ({
        category,
        revenue,
        percentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // Tren registrasi & check-in harian (data asli dari tabel registrations & attendances)
    const rangeStart = new Date();
    rangeStart.setDate(rangeStart.getDate() - (days - 1));
    rangeStart.setHours(0, 0, 0, 0);

    const [registrationsInRange, attendancesInRange] = await Promise.all([
      prisma.registration.findMany({ where: { createdAt: { gte: rangeStart } }, select: { createdAt: true } }),
      prisma.attendance.findMany({ where: { checkInTime: { gte: rangeStart } }, select: { checkInTime: true } }),
    ]);

    const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
    const trendMap = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(rangeStart); d.setDate(d.getDate() + i);
      trendMap[dayKey(d)] = { date: dayKey(d), registrations: 0, checkins: 0 };
    }
    registrationsInRange.forEach((r) => {
      const key = dayKey(r.createdAt);
      if (trendMap[key]) trendMap[key].registrations += 1;
    });
    attendancesInRange.forEach((a) => {
      if (!a.checkInTime) return;
      const key = dayKey(a.checkInTime);
      if (trendMap[key]) trendMap[key].checkins += 1;
    });
    const registrationTrend = Object.values(trendMap);

    return res.json({
      success: true,
      data: {
        summary: {
          totalEvents,
          totalRegistrations: totalRegistrationsAll,
          totalAttended: totalAttendedAll,
          overallAttendanceRate,
          totalRevenue,
          mostPopularEvent: mostPopular ? { title: mostPopular.title, totalRegistrations: mostPopular.totalRegistrations } : null,
        },
        perEvent,
        revenueByCategory,
        registrationTrend,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

module.exports = { getReports };