const prisma = require('../config/db');

async function listEmailLogs(req, res) {
  try {
    const { status, search = '' } = req.query;
    const logs = await prisma.emailLog.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(search ? { recipientEmail: { contains: search } } : {}),
      },
      include: {
        registration: {
          include: { user: { select: { fullname: true } }, event: { select: { title: true } } },
        },
      },
      orderBy: { sentAt: 'desc' },
    });

    const data = logs.map((l) => ({
      id: l.id,
      recipientEmail: l.recipientEmail,
      recipientName: l.registration.user.fullname,
      eventTitle: l.registration.event.title,
      subject: l.subject,
      status: l.status,
      sentAt: l.sentAt,
    }));

    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}


async function getEmailLogStats(req, res) {
  try {
    const total = await prisma.emailLog.count();
    const sent = await prisma.emailLog.count({ where: { status: 'sent' } });
    const failed = await prisma.emailLog.count({ where: { status: 'failed' } });
    const successRate = total > 0 ? Math.round((sent / total) * 100) : 0;
    return res.json({ success: true, data: { total, sent, failed, successRate } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

module.exports = { listEmailLogs, getEmailLogStats };
