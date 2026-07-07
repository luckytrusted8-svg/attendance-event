const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan. Silakan login.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const admin = await prisma.admin.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Admin tidak ditemukan.' });
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      fullname: admin.fullname,
      roleId: admin.roleId,
      roleName: admin.role.name,
    };

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
  }
}

function requireRole(...allowedRoleNames) {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Belum terautentikasi.' });
    }
    if (!allowedRoleNames.includes(req.admin.roleName)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Endpoint ini hanya untuk role: ${allowedRoleNames.join(', ')}.`,
      });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
