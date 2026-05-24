const express = require('express');
const router = express.Router();
const { getAllocationData, getMovementData } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/allocation', protect, getAllocationData);
router.get('/movement', protect, getMovementData);

module.exports = router;

