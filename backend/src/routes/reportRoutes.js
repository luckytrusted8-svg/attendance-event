const express = require('express');
const { getReports } = require('../controllers/reportController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, requireRole('Admin Level 1'), getReports);

module.exports = router;
