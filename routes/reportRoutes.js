const express = require('express');
const router = express.Router();
const { getDailyReport, getMonthlyReport, getYearlyReport } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/daily', protect, getDailyReport);
router.get('/monthly', protect, getMonthlyReport);
router.get('/yearly', protect, getYearlyReport);

module.exports = router;

