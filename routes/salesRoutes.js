const express = require('express');
const router = express.Router();
const {
  getSalesReps,
  getSalesRepById,
  createSalesRep,
  updateSalesRep,
  deleteSalesRep,
} = require('../controllers/salesController');
const { protect, admin } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, getSalesReps)
  .post(protect, admin, createSalesRep);

router.route('/:id')
  .get(protect, getSalesRepById)
  .put(protect, admin, updateSalesRep)
  .delete(protect, admin, deleteSalesRep);

module.exports = router;

