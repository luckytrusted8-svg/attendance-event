const express = require('express');
const { body } = require('express-validator');
const { createAdmin, listAdmins } = require('../controllers/adminController');
const { handleValidation } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  requireRole('Admin Level 1'),
  [
    body('fullname').notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('roleId').isInt(),
  ],
  handleValidation,
  createAdmin
);

router.get('/', requireAuth, requireRole('Admin Level 1'), listAdmins);

module.exports = router;
