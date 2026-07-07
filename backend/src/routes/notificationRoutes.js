const express = require('express');
const { listEmailLogs, getEmailLogStats } = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/email-logs', requireAuth, listEmailLogs);
router.get('/email-logs/stats', requireAuth, getEmailLogStats);

module.exports = router;
