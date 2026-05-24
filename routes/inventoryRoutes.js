const express = require('express');
const router = express.Router();
const {
  getInventorySummary,
  addStock,
  getInventoryLogs,
  getProductInventoryReport
} = require('../controllers/inventoryController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.get('/summary', protect, admin, getInventorySummary);
router.post('/add', protect, admin, addStock);
router.get('/logs', protect, getInventoryLogs);
router.get('/product-report', protect, admin, getProductInventoryReport);

module.exports = router;

