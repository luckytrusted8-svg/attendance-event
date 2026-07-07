const bcrypt = require('bcryptjs');
const prisma = require('../config/db');
const { signAdminToken } = require('../utils/token');

async function loginUser(req, res) {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findFirst({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }
    const { password: _pw, ...safeUser } = user;
    return res.json({ success: true, data: safeUser });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

async function loginAdmin(req, res) {
  const { email, password } = req.body;
  try {
    const admin = await prisma.admin.findUnique({ where: { email }, include: { role: true } });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }
    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Email atau password salah.' });
    }

    const token = signAdminToken(admin);
    return res.json({
      success: true,
      message: 'Login berhasil.',
      data: {
        token,
        admin: {
          id: admin.id,
          fullname: admin.fullname,
          email: admin.email,
          role: admin.role.name,
          roleId: admin.roleId,
        },
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * GET /api/auth/admin
 * Mengambil profil admin yang sedang login (dari token)
 */
async function getMyProfile(req, res) {
  try {
    const admin = await prisma.admin.findUnique({
      where: { id: req.admin.id },
      include: { role: true },
    });
    if (!admin) return res.status(404).json({ success: false, message: 'Admin tidak ditemukan.' });
    const { password, ...safe } = admin;
    return res.json({ success: true, data: safe });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

/**
 * GET /api/auth/roles
 * Daftar role beserta jumlah admin per role (halaman referensi role)
 */
async function listRoles(req, res) {
  try {
    const roles = await prisma.role.findMany({
      include: { _count: { select: { admins: true } } },
      orderBy: { id: 'asc' },
    });
    const data = roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      totalAdmins: r._count.admins,
    }));
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Terjadi kesalahan server.', error: err.message });
  }
}

module.exports = { loginUser, loginAdmin, getMyProfile, listRoles };
