const prisma = require('../config/db');
const { generateQrDataUrl } = require('../utils/qrcode');

function computeEventPhase(event) {
  const now = new Date();
  const start = combineDateTime(event.eventDate, event.startTime);
  const end = combineDateTime(event.eventDate, event.endTime);
  if (now < start) return 'upcoming';
  if (now > end) return 'finished';
  return 'ongoing';
}

function combineDateTime(dateVal, timeVal) {
  const d = new Date(dateVal);
  const t = new Date(timeVal);
  const combined = new Date(d);
  combined.setHours(t.getUTCHours(), t.getUTCMinutes(), t.getUTCSeconds(), 0);
  return combined;
}

async function createEvent(req, res) {
  const { title, description, location, eventDate, startTime, endTime, imageUrl, status } = req.body;
  try {
    const event = await prisma.event.create({
      data: {
        adminId: req.admin.id,
        title,
        description,
        location,
        eventDate: new Date(eventDate),
        startTime: new Date(`1970-01-01T${startTime}:00Z`),
        endTime: new Date(`1970-01-01T${endTime}:00Z`),
        status: status || 'draft',
        imageUrl: imageUrl || null,
      },
    });
    return res.status(201).json({ success: true, message: 'Event berhasil dibuat.', data: event });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * GET /api/events
 * Daftar event. Publik: hanya status "published", dikelompokkan (ongoing/upcoming/finished).
 * Admin (terautentikasi): seluruh event miliknya / semua event.
 * Query: ?search=&status=&phase=
 */
async function listEvents(req, res) {
  try {
    const { search = '', phase, status } = req.query;
    const isPublic = !req.admin;

    const events = await prisma.event.findMany({
      where: {
        ...(isPublic ? { status: 'published' } : status ? { status } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { location: { contains: search } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { registrations: true } } },
      orderBy: { eventDate: 'asc' },
    });

    let data = events.map((e) => ({
      ...e,
      totalRegistrations: e._count.registrations,
      phase: computeEventPhase(e),
      _count: undefined,
    }));

    if (phase) {
      data = data.filter((e) => e.phase === phase);
    }

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * GET /api/events/:id
 */
async function getEventById(req, res) {
  try {
    const id = Number(req.params.id);
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        admin: { select: { id: true, fullname: true, email: true } },
        _count: { select: { registrations: true } },
      },
    });
    if (!event) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    return res.json({
      success: true,
      data: { ...event, totalRegistrations: event._count.registrations, phase: computeEventPhase(event) },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * GET /api/events/:id/qr
 * QR Code Event -> berisi tautan langsung ke halaman registrasi event (untuk dicetak/disebar)
 */
async function getEventQr(req, res) {
  try {
    const id = Number(req.params.id);
    const event = await prisma.event.findUnique({ where: { id } });
    if (!event) return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });

    const registrationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${id}`;
    const qrDataUrl = await generateQrDataUrl(registrationUrl);
    return res.json({ success: true, data: { url: registrationUrl, qrCode: qrDataUrl } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * GET /api/events/:id/stats
 * Statistik per event: total pendaftar, total hadir, attendance rate
 */
async function getEventStats(req, res) {
  try {
    const id = Number(req.params.id);
    const totalRegistrations = await prisma.registration.count({ where: { eventId: id } });
    const totalAttended = await prisma.attendance.count({
      where: { registration: { eventId: id }, attendanceStatus: 'hadir' },
    });
    const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;
    return res.json({
      success: true,
      data: { totalRegistrations, totalAttended, attendanceRate },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * PATCH /api/events/:id/background
 * Mengubah gambar/banner latar event (dipakai juga untuk latar tampilan Scanner per perangkat)
 */
async function updateEventBackground(req, res) {
  try {
    const id = Number(req.params.id);
    const { bannerBg } = req.body;
    const event = await prisma.event.update({ where: { id }, data: { bannerBg } });
    return res.json({ success: true, message: 'Background berhasil diperbarui.', data: event });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * PATCH /api/events/:id/status
 * Mengubah status event: draft | published | closed (khusus Admin Level 1)
 */
async function updateEventStatus(req, res) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!['draft', 'published', 'closed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid.' });
    }
    const event = await prisma.event.update({ where: { id }, data: { status } });
    return res.json({ success: true, message: `Status event diubah menjadi "${status}".`, data: event });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * GET /api/events/dashboard/stats
 * Ringkasan statistik dashboard: total event, total peserta, event aktif, attendance rate keseluruhan
 */
async function getDashboardStats(req, res) {
  try {
    const totalEvents = await prisma.event.count();
    const totalUsers = await prisma.user.count();
    const activeEvents = await prisma.event.count({ where: { status: 'published' } });
    const totalRegistrations = await prisma.registration.count();
    const totalAttended = await prisma.attendance.count({ where: { attendanceStatus: 'hadir' } });
    const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;

    return res.json({
      success: true,
      data: { totalEvents, totalUsers, activeEvents, totalRegistrations, totalAttended, attendanceRate },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * GET /api/events/dashboard/activity
 * Log aktivitas terbaru (pendaftaran baru & check-in) lintas seluruh event
 */
async function getDashboardActivity(req, res) {
  try {
    const recentRegistrations = await prisma.registration.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { fullname: true } }, event: { select: { title: true } } },
    });
    const recentAttendances = await prisma.attendance.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        registration: {
          include: { user: { select: { fullname: true } }, event: { select: { title: true } } },
        },
      },
    });

    const activities = [
      ...recentRegistrations.map((r) => ({
        type: 'registration',
        message: `${r.user.fullname} mendaftar ke event "${r.event.title}"`,
        timestamp: r.createdAt,
      })),
      ...recentAttendances.map((a) => ({
        type: 'attendance',
        message: `${a.registration.user.fullname} check-in pada event "${a.registration.event.title}"`,
        timestamp: a.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 15);

    return res.json({ success: true, data: activities });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

module.exports = {
  createEvent,
  listEvents,
  getEventById,
  getEventQr,
  getEventStats,
  updateEventBackground,
  updateEventStatus,
  getDashboardStats,
  getDashboardActivity,
};
