const Product = require('../models/Product');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  const { name, sku, price, stock, category, description, image, minLevel } = req.body;
  const Branch = require('../models/Branch');
  const BranchInventory = require('../models/BranchInventory');

  try {
    const productExists = await Product.findOne({ sku });

    if (productExists) {
      return res.status(400).json({ message: 'Product with this SKU already exists' });
    }

    // Convert to numbers to avoid string issues
    const numericStock = Number(stock) || 0;
    const numericPrice = Number(price) || 0;
    const numericMinLevel = Number(minLevel) || 5;

    const product = await Product.create({
      name,
      sku,
      price: numericPrice,
      stock: req.user.role === 'admin' ? numericStock : 0, // Branch products don't go to Main Warehouse
      category,
      description,
      image,
      minLevel: numericMinLevel,
    });

    // If the user is a branch manager, link this product to their branch inventory
    if (req.user && req.user.role === 'branch') {
      const branch = await Branch.findOne({ user: req.user._id });
      if (branch) {
        await BranchInventory.create({
          branch: branch._id,
          product: product._id,
          currentStock: numericStock, // Initial stock for the branch
        });
      }
    }

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  const { name, price, stock, category, description, image, minLevel } = req.body;

  try {
    const product = await Product.findById(req.params.id);

    if (product) {
      product.name = name || product.name;
      product.price = price !== undefined ? price : product.price;
      product.stock = stock !== undefined ? stock : product.stock;
      product.category = category || product.category;
      product.description = description || product.description;
      product.image = image || product.image;
      product.minLevel = minLevel !== undefined ? minLevel : product.minLevel;

      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await Product.findByIdAndDelete(req.params.id);
      // Also delete from all branch inventories
      const BranchInventory = require('../models/BranchInventory');
      await BranchInventory.deleteMany({ product: req.params.id });
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Seed products
// @route   POST /api/products/seed
// @access  Private/Admin
const seedProducts = async (req, res) => {
  const sampleProducts = [
    { name: 'iPhone 15 Pro', sku: 'APL-IP15-P', price: 999, stock: 100, category: 'Electronics' },
    { name: 'MacBook Air M2', sku: 'APL-MBA-M2', price: 1299, stock: 50, category: 'Electronics' },
    { name: 'AirPods Pro 2', sku: 'APL-APP-2', price: 249, stock: 200, category: 'Accessories' },
    { name: 'Samsung Galaxy S24', sku: 'SAM-S24', price: 899, stock: 80, category: 'Electronics' },
    { name: 'Sony WH-1000XM5', sku: 'SNY-XM5', price: 349, stock: 60, category: 'Accessories' },
  ];

  await Product.deleteMany({});
  const createdProducts = await Product.insertMany(sampleProducts);
  res.json(createdProducts);
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  seedProducts,
};
