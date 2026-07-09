const express = require('express');
const { listEmailLogs, getEmailLogStats, trackOpen, resendEmail, getSmtpStatus } = require('../controllers/notificationController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/email-logs', requireAuth, listEmailLogs);
router.get('/email-logs/stats', requireAuth, getEmailLogStats);
router.post('/email-logs/:id/resend', requireAuth, requireRole('Admin Level 1'), resendEmail);
router.get('/smtp-status', requireAuth, requireRole('Admin Level 1'), getSmtpStatus);

router.get('/track/:id', trackOpen);

module.exports = router;