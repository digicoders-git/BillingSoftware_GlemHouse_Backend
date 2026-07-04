const express = require('express');
const router = express.Router();
const { initiateReturn, getReturns, updateReturnStatus } = require('../controllers/returnController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .post(protect, initiateReturn)
  .get(protect, getReturns);

router.route('/:id/status')
  .patch(protect, updateReturnStatus);

module.exports = router;
