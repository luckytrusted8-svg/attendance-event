const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateUniqueRegistrationCode, generateQrDataUrl } = require('../utils/qrcode');
const { sendQrCodeEmail } = require('../utils/email');

async function registerToEvent(req, res) {
  const eventId = Number(req.params.eventId);
  const { fullname, email, password, phone, institution } = req.body;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    }
    if (event.status !== 'published') {
      return res.status(400).json({ success: false, message: 'Event ini belum/tidak dipublikasikan.' });
    }

    let user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      const hashed = await bcrypt.hash(password, 10);
      user = await prisma.user.create({
        data: { fullname, email, phone, institution, password: hashed },
      });
    }

    const existingRegistration = await prisma.registration.findFirst({
      where: { userId: user.id, eventId },
    });
    if (existingRegistration) {
      return res.status(409).json({ success: false, message: 'Anda sudah terdaftar pada event ini.' });
    }

    const qrCode = generateUniqueRegistrationCode();

    const registration = await prisma.registration.create({
      data: {
        userId: user.id,
        eventId,
        qrCode,
        registrationStatus: 'registered',
      },
      include: { user: true, event: true },
    });

    const qrDataUrl = await generateQrDataUrl(qrCode);
    sendQrCodeEmail({
      registrationId: registration.id,
      recipientEmail: user.email,
      recipientName: user.fullname,
      eventTitle: event.title,
      qrDataUrl,
    }).catch((e) => console.error('Email QR gagal terkirim:', e.message));

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil. QR Code dikirim ke email Anda.',
      data: {
        registrationId: registration.id,
        qrCode,
        qrDataUrl,
        event: { id: event.id, title: event.title },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

async function listEventRegistrations(req, res) {
  try {
    const eventId = Number(req.params.eventId);
    const { search = '' } = req.query;

    const registrations = await prisma.registration.findMany({
      where: {
        eventId,
        ...(search
          ? {
              user: {
                OR: [
                  { fullname: { contains: search } },
                  { email: { contains: search } },
                ],
              },
            }
          : {}),
      },
      include: { user: true, attendance: true },
      orderBy: { createdAt: 'desc' },
    });

    const data = registrations.map((r) => ({
      id: r.id,
      qrCode: r.qrCode,
      registrationStatus: r.registrationStatus,
      emailSent: r.emailSent,
      registrationDate: r.registrationDate,
      user: { id: r.user.id, fullname: r.user.fullname, email: r.user.email, phone: r.user.phone },
      attendance: r.attendance
        ? {
            status: r.attendance.attendanceStatus,
            checkInTime: r.attendance.checkInTime,
            method: r.attendance.attendanceMethod,
          }
        : null,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

module.exports = { registerToEvent, listEventRegistrations };
