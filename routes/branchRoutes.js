const express = require('express');
const router = express.Router();
const {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
} = require('../controllers/branchController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getBranches).post(protect, createBranch);
router
  .route('/:id')
  .get(protect, getBranchById)
  .put(protect, updateBranch)
  .delete(protect, deleteBranch);
router.patch('/:id/status', protect, toggleBranchStatus);

module.exports = router;
