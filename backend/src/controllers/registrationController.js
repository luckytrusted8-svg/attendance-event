const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { generateUniqueRegistrationCode, generateQrDataUrl } = require('../utils/qrcode');
const { sendQrCodeEmail } = require('../utils/email');

/**
 * POST /api/events/:eventId/registrations
 * Alur Registrasi Peserta:
 * 1) Validasi input (dilakukan di route via express-validator)
 * 2) Simpan data user (password di-hash) + registration dengan kode QR unik
 * 3) Generate QR Code dan kirim via email (async, tidak memblokir response lama)
 * 4) Catat status pengiriman ke email_logs
 */
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

    // Cari atau buat user berdasarkan email
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

    // Generate QR code image dan kirim email (tidak menghambat response lebih dari perlu)
    const qrDataUrl = await generateQrDataUrl(qrCode);
    sendQrCodeEmail({
      registrationId: registration.id,
      recipientEmail: user.email,
      recipientName: user.fullname,
      qrCode,
      qrDataUrl,
      event,
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

/**
 * GET /api/events/:eventId/registrations
 * Daftar pendaftar suatu event, beserta status kehadiran (untuk halaman Data Peserta admin)
 */
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

/**
 * POST /api/events/:eventId/registrations/manual
 * Registrasi peserta secara manual oleh admin (skenario daftar via offline / di lokasi),
 * tanpa memerlukan password dari peserta. Password acak tetap dibuat agar konsisten dengan
 * skema akun peserta, dan tidak pernah diberitahukan (peserta tidak login sendiri).
 * QR Code & email tetap dikirim seperti alur registrasi normal.
 */
async function manualRegisterToEvent(req, res) {
  const eventId = Number(req.params.eventId);
  const { fullname, email, phone, institution } = req.body;

  try {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event tidak ditemukan.' });
    }

    let user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      const randomPassword = generateUniqueRegistrationCode(); // dipakai sebagai password acak, tidak pernah dibagikan
      const hashed = await bcrypt.hash(randomPassword, 10);
      user = await prisma.user.create({
        data: { fullname, email, phone, institution, password: hashed },
      });
    }

    const existingRegistration = await prisma.registration.findFirst({
      where: { userId: user.id, eventId },
    });
    if (existingRegistration) {
      return res.status(409).json({ success: false, message: 'Peserta ini sudah terdaftar pada event tersebut.' });
    }

    const qrCode = generateUniqueRegistrationCode();
    const registration = await prisma.registration.create({
      data: { userId: user.id, eventId, qrCode, registrationStatus: 'registered' },
    });

    const qrDataUrl = await generateQrDataUrl(qrCode);
    sendQrCodeEmail({
      registrationId: registration.id,
      recipientEmail: user.email,
      recipientName: user.fullname,
      qrCode,
      qrDataUrl,
      event,
    }).catch((e) => console.error('Email QR gagal terkirim:', e.message));

    return res.status(201).json({
      success: true,
      message: 'Peserta berhasil didaftarkan secara manual.',
      data: { registrationId: registration.id, qrCode, qrDataUrl, event: { id: event.id, title: event.title } },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

module.exports = { registerToEvent, manualRegisterToEvent, listEventRegistrations };