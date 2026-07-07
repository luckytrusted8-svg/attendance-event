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

async function sendQrCodeEmail({ registrationId, recipientEmail, recipientName, eventTitle, qrDataUrl }) {
  const subject = `QR Code Kehadiran - ${eventTitle}`;
  const base64Data = qrDataUrl.split(',')[1];

  let status = 'sent';
  try {
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipientEmail,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto;">
          <h2>Halo, ${recipientName}!</h2>
          <p>Terima kasih telah mendaftar pada event <strong>${eventTitle}</strong>.</p>
          <p>Silakan tunjukkan QR Code berikut kepada panitia saat check-in di lokasi event:</p>
          <img src="cid:qrcode" alt="QR Code Kehadiran" style="width:250px;height:250px;" />
          <p>Simpan email ini hingga hari pelaksanaan event berlangsung.</p>
        </div>
      `,
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
    console.error('Gagal mengirim email QR Code:', err.message);
  }

  await prisma.emailLog.create({
    data: {
      registrationId,
      recipientEmail,
      subject,
      status,
    },
  });

  if (status === 'sent') {
    await prisma.registration.update({
      where: { id: registrationId },
      data: { emailSent: true },
    });
  }

  return status;
}

module.exports = { sendQrCodeEmail };
