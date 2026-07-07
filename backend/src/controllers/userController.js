const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

async function createUser(req, res) {
  const { fullname, email, phone, institution, password } = req.body;
  try {
    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email sudah terdaftar.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { fullname, email, phone, institution, password: hashed },
    });
    const { password: _pw, ...safe } = user;
    return res.status(201).json({ success: true, data: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

async function listUsers(req, res) {
  try {
    const { search = '' } = req.query;
    const users = await prisma.user.findMany({
      where: search
        ? {
            OR: [
              { fullname: { contains: search } },
              { email: { contains: search } },
            ],
          }
        : undefined,
      include: { _count: { select: { registrations: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const data = users.map((u) => {
      const { password, _count, ...rest } = u;
      return { ...rest, totalRegistrations: _count.registrations };
    });
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

async function getUserById(req, res) {
  try {
    const id = Number(req.params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        registrations: {
          include: { event: true, attendance: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
    const { password, ...safe } = user;
    return res.json({ success: true, data: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

module.exports = { createUser, listUsers, getUserById };
