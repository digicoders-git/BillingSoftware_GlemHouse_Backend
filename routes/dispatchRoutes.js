const express = require('express');
const router = express.Router();
const {
  createDispatch,
  getDispatches,
  getDispatchById,
  updateDispatchStatus,
} = require('../controllers/dispatchController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getDispatches).post(protect, createDispatch);
router.route('/:id').get(protect, getDispatchById);
router.patch('/:id/status', protect, updateDispatchStatus);

module.exports = router;

