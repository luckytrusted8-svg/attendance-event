const bcrypt = require('bcryptjs');
const prisma = require('../config/db');

async function createAdmin(req, res) {
  const { fullname, email, password, roleId } = req.body;
  try {
    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email admin sudah digunakan.' });
    }
    const role = await prisma.role.findUnique({ where: { id: Number(roleId) } });
    if (!role) {
      return res.status(400).json({ success: false, message: 'Role tidak ditemukan.' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.create({
      data: { fullname, email, password: hashed, roleId: Number(roleId) },
      include: { role: true },
    });
    const { password: _pw, ...safe } = admin;
    return res.status(201).json({ success: true, message: 'Admin berhasil dibuat.', data: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

async function listAdmins(req, res) {
  try {
    const admins = await prisma.admin.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
    const data = admins.map(({ password, ...rest }) => rest);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

module.exports = { createAdmin, listAdmins };
