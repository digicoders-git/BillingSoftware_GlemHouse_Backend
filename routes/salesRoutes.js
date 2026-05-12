const express = require('express');
const router = express.Router();
const {
  getSales,
  getSalesById,
  createSales,
  updateSales,
  deleteSales,
} = require('../controllers/salesController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, getSales)
  .post(protect, admin, createSales);

router.route('/:id')
  .get(protect, getSalesById)
  .put(protect, admin, updateSales)
  .delete(protect, admin, deleteSales);

module.exports = router;
