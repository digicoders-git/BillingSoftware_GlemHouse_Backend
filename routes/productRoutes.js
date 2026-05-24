const express = require('express');
const router = express.Router();
const { 
  getProducts, 
  getProductById, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  seedProducts 
} = require('../controllers/productController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/')
  .get(protect, getProducts)
  .post(protect, createProduct);

router.route('/:id')
  .get(protect, getProductById)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

router.post('/seed', protect, seedProducts);

module.exports = router;

