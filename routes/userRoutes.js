const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');
const asyncHandler = require('../middlewares/asyncHandler');

router.route('/profile')
  .get(protect, asyncHandler(getUserProfile))
  .put(protect, asyncHandler(updateUserProfile));

router.put('/change-password', protect, asyncHandler(changePassword));

module.exports = router;

