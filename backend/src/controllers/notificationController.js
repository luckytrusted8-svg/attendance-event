const prisma = require('../config/db');
const { sendQrCodeEmail, verifySmtpConnection } = require('../utils/email');
const { generateQrDataUrl } = require('../utils/qrcode');

// 1x1 transparent PNG (base64) dipakai sebagai tracking pixel
const TRANSPARENT_PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  'base64'
);

/**
 * GET /api/notifications/email-logs
 * Riwayat pengiriman email, dengan filter status, tanggal, dan event.
 */
async function listEmailLogs(req, res) {
  try {
    const { status, search = '', eventId, dateFrom, dateTo } = req.query;
    const logs = await prisma.emailLog.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search ? { recipientEmail: { contains: search } } : {}),
        ...(eventId ? { registration: { eventId: Number(eventId) } } : {}),
        ...(dateFrom || dateTo
          ? {
              sentAt: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(`${dateTo}T23:59:59`) } : {}),
              },
            }
          : {}),
      },
      include: {
        registration: {
          include: { user: { select: { id: true, fullname: true } }, event: { select: { title: true } } },
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    const data = logs.map((l) => ({
      id: l.id,
      recipientEmail: l.recipientEmail,
      recipientName: l.registration.user.fullname,
      userId: l.registration.user.id,
      eventTitle: l.registration.event.title,
      subject: l.subject,
      status: l.status,
      errorDetail: l.errorDetail,
      opened: Boolean(l.openedAt),
      openedAt: l.openedAt,
      sentAt: l.sentAt,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * GET /api/notifications/email-logs/stats
 * Success rate & open rate untuk kartu statistik halaman Log Email.
 */
async function getEmailLogStats(req, res) {
  try {
    const total = await prisma.emailLog.count();
    const sent = await prisma.emailLog.count({ where: { status: 'sent' } });
    const failed = await prisma.emailLog.count({ where: { status: 'failed' } });
    const opened = await prisma.emailLog.count({ where: { openedAt: { not: null } } });
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;
    const openRate = sent > 0 ? Math.round((opened / sent) * 100) : 0;
    return res.json({ success: true, data: { total, sent, failed, opened, successRate, openRate } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * GET /api/notifications/track/:id.png
 * Tracking pixel — diakses otomatis oleh email client saat email dibuka. Publik (tanpa auth),
 * karena email client tidak menyertakan token JWT saat memuat gambar.
 */
async function trackOpen(req, res) {
  try {
    const id = Number(req.params.id);
    if (id) {
      await prisma.emailLog.updateMany({
        where: { id, openedAt: null },
        data: { openedAt: new Date() },
      });
    }
  } catch (err) {
    console.error('Gagal mencatat tracking pixel:', err.message);
  }
  res.set('Content-Type', 'image/png');
  res.set('Cache-Control', 'no-store');
  return res.send(TRANSPARENT_PIXEL);
}

/**
 * POST /api/notifications/email-logs/:id/resend
 * Mengirim ulang email QR Code untuk log yang gagal (khusus Admin Level 1).
 */
async function resendEmail(req, res) {
  try {
    const id = Number(req.params.id);
    const log = await prisma.emailLog.findUnique({
      where: { id },
      include: { registration: { include: { user: true, event: true } } },
    });
    if (!log) return res.status(404).json({ success: false, message: 'Log email tidak ditemukan.' });

    const { registration } = log;
    const qrDataUrl = await generateQrDataUrl(registration.qrCode);
    const status = await sendQrCodeEmail({
      registrationId: registration.id,
      recipientEmail: registration.user.email,
      recipientName: registration.user.fullname,
      qrCode: registration.qrCode,
      qrDataUrl,
      event: registration.event,
    });

    return res.json({
      success: status === 'sent',
      message: status === 'sent' ? 'Email berhasil dikirim ulang.' : 'Pengiriman ulang gagal. Periksa konfigurasi SMTP.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * GET /api/notifications/smtp-status
 * Menguji koneksi SMTP saat ini tanpa mengirim email (khusus Admin Level 1).
 */
async function getSmtpStatus(req, res) {
  const result = await verifySmtpConnection();
  return res.json({ success: result.ok, message: result.message });
}

module.exports = { listEmailLogs, getEmailLogStats, trackOpen, resendEmail, getSmtpStatus };