const express = require('express');
const router = express.Router();
const { getBranchInventory, adjustStock, getInventoryLogs, deleteBranchInventory } = require('../controllers/branchInventoryController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/', protect, getBranchInventory);
router.get('/logs', protect, getInventoryLogs);
router.put('/:id/adjust', protect, adjustStock);
router.delete('/:id', protect, deleteBranchInventory);

module.exports = router;
