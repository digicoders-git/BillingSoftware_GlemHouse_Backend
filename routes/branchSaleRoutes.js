const express = require('express');
const router = express.Router();
const { getBranchSales, createSale, getBranchReport, getBranchDashboard } = require('../controllers/branchSaleController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getBranchSales);
router.get('/reports', protect, getBranchReport);
router.get('/dashboard', protect, getBranchDashboard);
router.post('/', protect, createSale);

module.exports = router;

