const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
} = require('../controllers/userController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router.put('/change-password', protect, changePassword);

module.exports = router;
