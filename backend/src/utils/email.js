const nodemailer = require('nodemailer');
const prisma = require('../config/db');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function formatDateID(dateVal) {
  return new Date(dateVal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
function formatTimeID(timeVal) {
  return new Date(timeVal).toISOString().slice(11, 16);
}
function formatPrice(event) {
  if (!event.isPaid) return 'Gratis';
  return `Rp ${Number(event.price || 0).toLocaleString('id-ID')}`;
}

/**
 * Membangun isi HTML email berdasarkan data lengkap event (kategori, tiket, lokasi/online, rundown acara).
 * Menyertakan tracking pixel 1x1 untuk mencatat kapan email ini dibuka (openedAt pada email_logs).
 */
function buildEmailHtml({ recipientName, qrCode, event, logId }) {
  const agenda = Array.isArray(event.agenda) ? event.agenda : [];
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
  const trackingPixel = `<img src="${backendUrl}/api/notifications/track/${logId}" width="1" height="1" alt="" style="display:block;border:0;" />`;

  const agendaHtml = agenda.length
    ? `
      <tr>
        <td style="padding-top:24px;">
          <p style="font-size:15px; font-weight:600; color:#0f172a; margin:0 0 10px;">Rundown Acara</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
            ${agenda
              .map(
                (row, i) => `
              <tr style="${i > 0 ? 'border-top:1px solid #e2e8f0;' : ''}">
                <td style="padding:10px 14px; font-size:13px; font-weight:600; color:#2563eb; white-space:nowrap; vertical-align:top;">${row.time || '-'}</td>
                <td style="padding:10px 14px; font-size:13px; color:#0f172a;">
                  <div style="font-weight:600;">${row.title || ''}</div>
                  ${row.speaker ? `<div style="color:#64748b; margin-top:2px;">${row.speaker}</div>` : ''}
                </td>
              </tr>`
              )
              .join('')}
          </table>
        </td>
      </tr>`
    : '';

  const paidNotice = event.isPaid
    ? `<tr><td style="padding-top:16px;">
         <div style="background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:12px 14px; font-size:13px; color:#92400e;">
           Event ini <strong>berbayar (${formatPrice(event)})</strong>. Detail pembayaran akan diinformasikan langsung oleh panitia.
         </div>
       </td></tr>`
    : '';

  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background:#f8fafc; padding:32px 16px;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; border:1px solid #e2e8f0;">
      <tr>
        <td style="background:#1e293b; padding:20px 28px;">
          <span style="color:#ffffff; font-size:16px; font-weight:800;">Event<span style="color:#60a5fa;">Digital</span></span>
        </td>
      </tr>
      <tr>
        <td style="padding:28px;">
          <h2 style="margin:0 0 4px; font-size:19px; color:#0f172a;">Halo, ${recipientName}!</h2>
          <p style="margin:0 0 20px; font-size:14px; color:#475569; line-height:1.6;">
            Registrasi Anda untuk event berikut telah <strong>berhasil dikonfirmasi</strong>.
          </p>

          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <div style="background:#eff6ff; border-radius:10px; padding:16px 18px;">
                  ${event.category ? `<span style="display:inline-block; background:#dbeafe; color:#2563eb; font-size:11px; font-weight:700; padding:3px 10px; border-radius:999px; margin-bottom:8px;">${event.category}</span>` : ''}
                  <p style="margin:6px 0 0; font-size:17px; font-weight:700; color:#0f172a;">${event.title}</p>
                  <table cellpadding="0" cellspacing="0" style="margin-top:12px; font-size:13px; color:#334155;">
                    <tr><td style="padding:2px 0;">🗓&nbsp;&nbsp;${formatDateID(event.eventDate)}</td></tr>
                    <tr><td style="padding:2px 0;">🕐&nbsp;&nbsp;${formatTimeID(event.startTime)} – ${formatTimeID(event.endTime)} WIB</td></tr>
                    <tr><td style="padding:2px 0;">📍&nbsp;&nbsp;${event.isOnline ? `Online — ${event.location || 'tautan menyusul'}` : (event.location || 'Lokasi menyusul')}</td></tr>
                    <tr><td style="padding:2px 0;">🎫&nbsp;&nbsp;${formatPrice(event)}</td></tr>
                  </table>
                </div>
              </td>
            </tr>

            ${paidNotice}

            <tr>
              <td style="padding-top:24px; text-align:center;">
                <p style="font-size:14px; color:#475569; margin:0 0 12px;">
                  Tunjukkan QR Code ini kepada panitia saat check-in di lokasi event:
                </p>
                <img src="cid:qrcode" alt="QR Code Kehadiran" width="220" height="220" style="border:1px solid #e2e8f0; border-radius:12px;" />
                <p style="font-family: monospace; font-size:12px; color:#94a3b8; margin:10px 0 0;">${qrCode}</p>
              </td>
            </tr>

            ${agendaHtml}

            <tr>
              <td style="padding-top:24px;">
                <div style="background:#f1f5f9; border-radius:8px; padding:14px 16px; font-size:13px; color:#475569; line-height:1.6;">
                  <strong>Catatan penting:</strong><br />
                  • Simpan email ini hingga hari pelaksanaan event.<br />
                  • Datang tepat waktu sesuai jadwal di atas.<br />
                  • QR Code hanya berlaku untuk satu kali check-in.
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="background:#f8fafc; padding:16px 28px; text-align:center;">
          <p style="margin:0; font-size:11px; color:#94a3b8;">Email ini dikirim otomatis oleh sistem EventDigital. Mohon tidak membalas email ini.</p>
        </td>
      </tr>
    </table>
  </div>
  ${trackingPixel}`;
}

/**
 * Mengirim email berisi detail lengkap event + QR Code kehadiran ke peserta setelah registrasi,
 * lalu mencatat status pengiriman (beserta pesan error asli jika gagal) ke tabel email_logs.
 *
 * @param {object} params
 * @param {number} params.registrationId
 * @param {string} params.recipientEmail
 * @param {string} params.recipientName
 * @param {string} params.qrCode - kode registrasi unik (teks, ditampilkan sebagai cadangan selain gambar QR)
 * @param {string} params.qrDataUrl - base64 data URL PNG QR code peserta
 * @param {object} params.event - detail event: { title, eventDate, startTime, endTime, location, isOnline, category, isPaid, price, agenda }
 */
async function sendQrCodeEmail({ registrationId, recipientEmail, recipientName, qrCode, qrDataUrl, event }) {
  const subject = `Konfirmasi Registrasi & QR Code Kehadiran - ${event.title}`;
  const base64Data = qrDataUrl.split(',')[1];

  // Buat baris log terlebih dahulu (status "pending") agar ID-nya bisa dipakai untuk tracking pixel di email.
  const log = await prisma.emailLog.create({
    data: { registrationId, recipientEmail, subject, status: 'pending' },
  });

  let status = 'sent';
  let errorDetail = null;

  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      subject,
      html: buildEmailHtml({ recipientName, qrCode, event, logId: log.id }),
      attachments: [
        {
          filename: 'qrcode.png',
          content: base64Data,
          encoding: 'base64',
          cid: 'qrcode',
        },
      ],
    });
  } catch (err) {
    status = 'failed';
    errorDetail = err.message;
    console.error('Gagal mengirim email QR Code:', err.message);
  }

  await prisma.emailLog.update({
    where: { id: log.id },
    data: { status, errorDetail },
  });

  if (status === 'sent') {
    await prisma.registration.update({
      where: { id: registrationId },
      data: { emailSent: true },
    });
  }

  return status;
}

async function verifySmtpConnection() {
  try {
    await getTransporter().verify();
    return { ok: true, message: 'Koneksi SMTP berhasil diverifikasi.' };
  } catch (err) {
    return { ok: false, message: err.message };
  }
}

module.exports = { sendQrCodeEmail, verifySmtpConnection };