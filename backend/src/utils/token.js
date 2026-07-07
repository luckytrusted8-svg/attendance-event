const jwt = require('jsonwebtoken');

function signAdminToken(admin) {
  return jwt.sign(
    { id: admin.id, email: admin.email, roleId: admin.roleId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

module.exports = { signAdminToken };
