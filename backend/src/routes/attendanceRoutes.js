const express = require('express');
const { body } = require('express-validator');
const { checkInByScan, checkInManual, listAttendanceByEvent } = require('../controllers/attendanceController');
const { handleValidation } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/scan',
  requireAuth,
  requireRole('Admin Level 1', 'Admin Level 2'),
  [body('qrCode').notEmpty().withMessage('QR Code wajib disertakan.')],
  handleValidation,
  checkInByScan
);

router.post('/manual', requireAuth, requireRole('Admin Level 1', 'Admin Level 2'), checkInManual);

router.get('/event/:eventId', requireAuth, listAttendanceByEvent);

module.exports = router;
