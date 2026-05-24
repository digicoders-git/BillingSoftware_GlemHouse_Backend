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
const asyncHandler = require('../middlewares/asyncHandler');

router.route('/')
.get(protect, asyncHandler(getBranches))
.post(protect, asyncHandler(createBranch));

router
  .route('/:id')
  .get(protect, asyncHandler(getBranchById))
  .put(protect, asyncHandler(updateBranch))
  .delete(protect, asyncHandler(deleteBranch));

router.patch('/:id/status', protect, asyncHandler(toggleBranchStatus));

module.exports = router;

