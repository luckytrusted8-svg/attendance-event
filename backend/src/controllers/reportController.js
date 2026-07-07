const prisma = require('../config/db');

async function getReports(req, res) {
  try {
    const events = await prisma.event.findMany({
      include: {
        _count: { select: { registrations: true } },
      },
      orderBy: { eventDate: 'desc' },
    });

    const perEvent = await Promise.all(
      events.map(async (e) => {
        const totalAttended = await prisma.attendance.count({
          where: { registration: { eventId: e.id }, attendanceStatus: 'hadir' },
        });
        const totalRegistrations = e._count.registrations;
        const attendanceRate = totalRegistrations > 0 ? Math.round((totalAttended / totalRegistrations) * 100) : 0;
        return {
          eventId: e.id,
          title: e.title,
          eventDate: e.eventDate,
          status: e.status,
          totalRegistrations,
          totalAttended,
          attendanceRate,
        };
      })
    );

    const totalEvents = events.length;
    const totalRegistrationsAll = perEvent.reduce((sum, e) => sum + e.totalRegistrations, 0);
    const totalAttendedAll = perEvent.reduce((sum, e) => sum + e.totalAttended, 0);
    const overallAttendanceRate =
      totalRegistrationsAll > 0 ? Math.round((totalAttendedAll / totalRegistrationsAll) * 100) : 0;

    return res.json({
      success: true,
      data: {
        summary: {
          totalEvents,
          totalRegistrations: totalRegistrationsAll,
          totalAttended: totalAttendedAll,
          overallAttendanceRate,
        },
        perEvent,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

module.exports = { getReports };
