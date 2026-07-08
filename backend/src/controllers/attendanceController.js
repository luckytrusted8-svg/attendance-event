const prisma = require('../config/db');

async function checkInByScan(req, res) {
  const { qrCode } = req.body;
  try {
    const registration = await prisma.registration.findUnique({
      where: { qrCode },
      include: { user: true, event: true, attendance: true },
    });

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Data registrasi tidak ditemukan.' });
    }
    if (registration.attendance) {
      return res.status(409).json({
        success: false,
        message: 'Peserta ini sudah tercatat hadir sebelumnya.',
        data: { checkInTime: registration.attendance.checkInTime },
      });
    }

    const attendance = await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        checkedByAdmin: req.admin.id,
        checkInTime: new Date(),
        attendanceMethod: 'qr',
        attendanceStatus: 'hadir',
      },
    });

    return res.status(201).json({
      success: true,
      message: `Check-in berhasil untuk ${registration.user.fullname}.`,
      data: {
        attendance,
        participant: { fullname: registration.user.fullname, email: registration.user.email },
        event: { id: registration.event.id, title: registration.event.title },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

async function checkInManual(req, res) {
  const { registrationId, eventId, keyword } = req.body;
  try {
    let registration = null;

    if (registrationId) {
      registration = await prisma.registration.findUnique({
        where: { id: Number(registrationId) },
        include: { user: true, event: true, attendance: true },
      });
    } else if (eventId && keyword) {
      registration = await prisma.registration.findFirst({
        where: {
          eventId: Number(eventId),
          user: {
            OR: [
              { fullname: { contains: keyword } },
              { email: { contains: keyword } },
            ],
          },
        },
        include: { user: true, event: true, attendance: true },
      });
    }

    if (!registration) {
      return res.status(404).json({ success: false, message: 'Data peserta tidak ditemukan.' });
    }
    if (registration.attendance) {
      return res.status(409).json({ success: false, message: 'Peserta ini sudah tercatat hadir sebelumnya.' });
    }

    const attendance = await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        checkedByAdmin: req.admin.id,
        checkInTime: new Date(),
        attendanceMethod: 'manual',
        attendanceStatus: 'hadir',
      },
    });

    return res.status(201).json({
      success: true,
      message: `Check-in manual berhasil untuk ${registration.user.fullname}.`,
      data: { attendance, participant: { fullname: registration.user.fullname, email: registration.user.email } },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}


async function listAttendanceByEvent(req, res) {
  try {
    const eventId = Number(req.params.eventId);
    const attendances = await prisma.attendance.findMany({
      where: { registration: { eventId } },
      include: {
        registration: { include: { user: true } },
        admin: { select: { fullname: true } },
      },
      orderBy: { checkInTime: 'desc' },
    });

    const data = attendances.map((a) => ({
      id: a.id,
      fullname: a.registration.user.fullname,
      email: a.registration.user.email,
      checkInTime: a.checkInTime,
      method: a.attendanceMethod,
      status: a.attendanceStatus,
      verifiedBy: a.admin ? a.admin.fullname : null,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

module.exports = { checkInByScan, checkInManual, listAttendanceByEvent };
