const express = require('express');
const router = express.Router();
const {
  getDistributors,
  getDistributorById,
  createDistributor,
  updateDistributor,
  deleteDistributor,
} = require('../controllers/distributorController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, getDistributors)
  .post(protect, admin, createDistributor);

router.route('/:id')
  .get(protect, getDistributorById)
  .put(protect, admin, updateDistributor)
  .delete(protect, admin, deleteDistributor);

module.exports = router;
