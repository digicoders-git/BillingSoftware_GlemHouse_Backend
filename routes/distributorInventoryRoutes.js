const express = require('express');
const router = express.Router();
const { getDistributorInventory } = require('../controllers/distributorInventoryController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, getDistributorInventory);

module.exports = router;
