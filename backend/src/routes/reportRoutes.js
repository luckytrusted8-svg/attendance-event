const express = require('express');

const {
  getReports,
  exportPdf,
  exportExcel,
} = require('../controllers/reportController');

const {
  requireAuth,
  requireRole,
} = require('../middleware/auth');

const router = express.Router();

// Ambil laporan
router.get(
  '/',
  requireAuth,
  requireRole('Admin Level 1'),
  getReports
);

// Export PDF
router.get(
  '/export/pdf',
  requireAuth,
  requireRole('Admin Level 1'),
  exportPdf
);


router.get(
  '/export/excel',
  requireAuth,
  requireRole('Admin Level 1'),
  exportExcel
);

module.exports = router;