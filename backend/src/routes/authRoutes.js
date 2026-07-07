const express = require('express');
const { body } = require('express-validator');
const { loginUser, loginAdmin, getMyProfile, listRoles } = require('../controllers/authController');
const { handleValidation } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/login',
  [body('email').isEmail().withMessage('Email tidak valid.'), body('password').notEmpty()],
  handleValidation,
  loginUser
);

router.post(
  '/admin',
  [body('email').isEmail().withMessage('Email tidak valid.'), body('password').notEmpty()],
  handleValidation,
  loginAdmin
);

router.get('/admin', requireAuth, getMyProfile);
router.get('/roles', requireAuth, listRoles);

module.exports = router;
