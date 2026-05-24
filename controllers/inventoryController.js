const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const Dispatch = require('../models/Dispatch');
const BranchInventory = require('../models/BranchInventory');
const Branch = require('../models/Branch');
const SalesRep = require('../models/SalesRep');
const Distributor = require('../models/Distributor');

// @desc    Get admin inventory summary
// @route   GET /api/inventory/summary
// @access  Private/Admin
const getInventorySummary = async (req, res) => {
  try {
    // Calculate total stock value and low stock counts
    const products = await Product.find({});
    const bi = await BranchInventory.find({});

    const totalValue = products.reduce((acc, p) => acc + (p.stock * p.price), 0);

    // Calculate low stock based on GLOBAL stock (Warehouse + Branches)
    let lowStockCount = 0;
    for (const p of products) {
      const productBranchStock = bi.filter(b => b.product.toString() === p._id.toString())
                                   .reduce((sum, b) => sum + (b.currentStock || 0), 0);
      if ((p.stock + productBranchStock) <= (p.minLevel || 5)) {
        lowStockCount++;
      }
    }

    // Get Stock In/Out totals for Admin (branch: null)
    const logs = await InventoryLog.find({ branch: null });
    
    const stockIn = logs.filter(l => l.type === 'Stock In').reduce((acc, l) => acc + l.quantity, 0);
    const stockOut = logs.filter(l => l.type === 'Stock Out').reduce((acc, l) => acc + l.quantity, 0);

    res.json({
      totalProducts: products.length,
      totalStockValue: totalValue,
      lowStockCount,
      stockIn,
      stockOut,
      totalCurrentStock: products.reduce((acc, p) => acc + p.stock, 0),
      totalGlobalStock: await (async () => {
        const bi = await BranchInventory.find({});
        const branchTotal = bi.reduce((acc, b) => acc + (b.currentStock || 0), 0);
        const warehouseTotal = products.reduce((acc, p) => acc + p.stock, 0);
        return branchTotal + warehouseTotal;
      })()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add stock to main inventory
// @route   POST /api/inventory/add
// @access  Private/Admin
const addStock = async (req, res) => {
  const { productId, quantity, reason } = req.body;

  try {
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.stock += Number(quantity);
    await product.save();

    await InventoryLog.create({
      product: productId,
      type: 'Stock In',
      quantity: Number(quantity),
      reason: reason || 'Procurement',
      adjustedBy: req.user._id,
      branch: null
    });

    res.status(200).json({ message: 'Stock added successfully', stock: product.stock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory logs (Admin/Main Warehouse)
// @route   GET /api/inventory/logs
// @access  Private/Admin
const getInventoryLogs = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'branch') {
      const branch = await Branch.findOne({ user: req.user._id });
      query = { branch: branch?._id };
    } else if (req.user.role === 'sales') {
      const salesRep = await SalesRep.findOne({ user: req.user._id });
      query = { SalesRep: salesRep?._id };
    } else if (req.user.role === 'distributor') {
      const distributor = await Distributor.findOne({ user: req.user._id });
      query = { distributor: distributor?._id };
    } else if (req.user.role !== 'admin') {
      query = { branch: null }; 
    }
    
    // For admin, we show EVERYTHING by default or filter if needed
    const logs = await InventoryLog.find(req.user.role === 'admin' ? {} : query)
      .populate('product', 'name sku')
      .populate('adjustedBy', 'name')
      .populate('branch', 'name branchId')
      .populate('SalesRep', 'name salesId')
      .populate('distributor', 'name distributorId')
      .sort({ createdAt: -1 });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get detailed product inventory report
// @route   GET /api/inventory/product-report
// @access  Private/Admin
const getProductInventoryReport = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ name: 1 });
    
    const report = await Promise.all(products.map(async (p) => {
      const logs = await InventoryLog.find({ product: p._id, branch: null });
      const totalIn = logs.filter(l => l.type === 'Stock In').reduce((acc, l) => acc + l.quantity, 0);
      const totalOut = logs.filter(l => l.type === 'Stock Out').reduce((acc, l) => acc + l.quantity, 0);
      
      // Calculate branch stock
      const branchInventories = await BranchInventory.find({ product: p._id });
      const branchStock = branchInventories.reduce((sum, bi) => sum + (bi.currentStock || 0), 0);
      
      return {
        _id: p._id,
        name: p.name,
        sku: p.sku,
        warehouseStock: p.stock,
        branchStock: branchStock,
        totalStock: p.stock + branchStock,
        totalIn,
        totalOut,
        price: p.price,
        minLevel: p.minLevel || 5,
        value: (p.stock + branchStock) * p.price
      };
    }));

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInventorySummary,
  addStock,
  getInventoryLogs,
  getProductInventoryReport
};

