const express = require('express');
const { body } = require('express-validator');
const {
  createEvent,
  listEvents,
  getEventById,
  getEventQr,
  getEventStats,
  updateEventBackground,
  updateEventStatus,
  getDashboardStats,
  getDashboardActivity,
} = require('../controllers/eventController');
const { registerToEvent, listEventRegistrations } = require('../controllers/registrationController');
const { handleValidation } = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Middleware opsional: jika token tersedia, sisipkan req.admin; jika tidak, biarkan publik (landing page)
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) return next();
  return requireAuth(req, res, next);
}

// --- Dashboard (khusus admin) ---
router.get('/dashboard/stats', requireAuth, getDashboardStats);
router.get('/dashboard/activity', requireAuth, getDashboardActivity);

// --- Event CRUD ---
router.post(
  '/',
  requireAuth,
  requireRole('Admin Level 1'),
  [
    body('title').notEmpty().withMessage('Judul event wajib diisi.'),
    body('eventDate').notEmpty().withMessage('Tanggal event wajib diisi.'),
    body('startTime').notEmpty().withMessage('Jam mulai wajib diisi.'),
    body('endTime').notEmpty().withMessage('Jam selesai wajib diisi.'),
  ],
  handleValidation,
  createEvent
);

router.get('/', optionalAuth, listEvents);
router.get('/:id', getEventById);
router.get('/:id/qr', getEventQr);
router.get('/:id/stats', requireAuth, getEventStats);

router.patch('/:id/background', requireAuth, updateEventBackground);
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('Admin Level 1'),
  [body('status').isIn(['draft', 'published', 'closed'])],
  handleValidation,
  updateEventStatus
);

// --- Registrations (nested di bawah event) ---
router.post(
  '/:eventId/registrations',
  [
    body('fullname').notEmpty().withMessage('Nama lengkap wajib diisi.'),
    body('email').isEmail().withMessage('Email tidak valid.'),
    body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
  ],
  handleValidation,
  registerToEvent
);

router.get('/:eventId/registrations', requireAuth, listEventRegistrations);

module.exports = router;
