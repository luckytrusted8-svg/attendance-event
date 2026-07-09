const express = require('express');
const { listCategories, createCategory, deleteCategory } = require('../controllers/categoryController');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.get('/', listCategories);
router.post('/', requireAuth, requireRole('Admin Level 1'), createCategory);
router.delete('/:id', requireAuth, requireRole('Admin Level 1'), deleteCategory);

module.exports = router;