const express = require('express');
const { body } = require('express-validator');
const { createUser, listUsers, getUserById } = require('../controllers/userController');
const { handleValidation } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  [
    body('fullname').notEmpty().withMessage('Nama lengkap wajib diisi.'),
    body('email').isEmail().withMessage('Email tidak valid.'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
  ],
  handleValidation,
  createUser
);

router.get('/', requireAuth, requireRole('Admin Level 1'), listUsers);
router.get('/:id', requireAuth, requireRole('Admin Level 1'), getUserById);

module.exports = router;
