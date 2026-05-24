const BranchInventory = require('../models/BranchInventory');
const SalesRepInventory = require('../models/SalesRepInventory');
const Branch = require('../models/Branch');
const SalesRep = require('../models/SalesRep');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

// @desc    Get inventory for current branch or SalesRep
// @route   GET /api/branch-inventory
// @access  Private (Branch or SalesRep)
const getBranchInventory = async (req, res) => {
  try {
    let inventory = [];
    let name = '';

    if (req.user.role === 'branch' || (req.user.role === 'admin' && req.query.branchId)) {
      const branchId = req.user.role === 'branch' 
        ? (await Branch.findOne({ user: req.user._id }))?._id 
        : req.query.branchId;
        
      if (!branchId) return res.status(404).json({ message: 'Branch not found' });
      
      const branch = await Branch.findById(branchId);
      name = branch?.name || 'Branch';
      inventory = await BranchInventory.find({ branch: branchId })
        .populate('product', 'name category price sku image minLevel hsn batch');
    } else if (req.user.role === 'sales' || (req.user.role === 'admin' && req.query.SalesRepId)) {
      const SalesRepId = req.user.role === 'sales' 
        ? (await SalesRep.findOne({ user: req.user._id }))?._id 
        : req.query.SalesRepId;
        
      if (!SalesRepId) return res.status(404).json({ message: 'sales Rep not found' });
      
      const salesRep = await SalesRep.findById(SalesRepId);
      name = salesRep?.name || 'sales Rep';
      inventory = await SalesRepInventory.find({ SalesRep: SalesRepId })
        .populate('product', 'name category price sku image minLevel hsn batch');
    } else {
      return res.status(403).json({ message: 'Unauthorized role or missing parameters' });
    }

    // Aggregate stats
    const totalItems = inventory.reduce((sum, item) => sum + item.currentStock, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * (item.product?.price || 0)), 0);
    const lowStockCount = inventory.filter(item => item.currentStock > 0 && item.currentStock <= (item.product?.minLevel || 5)).length;
    const outOfStockCount = inventory.filter(item => item.currentStock === 0).length;

    res.json({
      inventory: inventory.map(item => ({
        _id: item._id,
        productID: item.product?._id,
        name: item.product?.name || 'Unknown',
        sku: item.product?.sku || 'N/A',
        hsn: item.product?.hsn || '',
        batch: item.product?.batch || '',
        category: item.product?.category || 'N/A',
        price: item.product?.price || 0,
        stock: item.currentStock,
        status: item.currentStock === 0 ? 'Out of Stock' : (item.currentStock <= (item.product?.minLevel || 5) ? 'Low Stock' : 'In Stock'),
        value: item.currentStock * (item.product?.price || 0)
      })),
      stats: {
        totalItems,
        totalValue,
        lowStockCount,
        outOfStockCount
      },
      name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Adjust stock for a specific inventory item
// @route   PUT /api/branch-inventory/:id/adjust
// @access  Private/Branch
const adjustStock = async (req, res) => {
  try {
    const { action, quantity } = req.body;
    let inventoryItem;
    
    if (req.user.role === 'branch') {
        inventoryItem = await BranchInventory.findById(req.params.id);
    } else if (req.user.role === 'sales') {
        inventoryItem = await SalesRepInventory.findById(req.params.id);
    }

    if (!inventoryItem) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    if (action === 'add') {
      inventoryItem.currentStock += Number(quantity);
    } else if (action === 'remove') {
      if (inventoryItem.currentStock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
      inventoryItem.currentStock -= Number(quantity);
    }

    await inventoryItem.save();

    // Create Log
    await InventoryLog.create({
      branch: inventoryItem.branch || null,
      product: inventoryItem.product,
      type: action === 'add' ? 'Stock In' : 'Stock Out',
      quantity: Number(quantity),
      reason: req.body.reason || 'Manual Adjustment',
      adjustedBy: req.user._id
    });

    res.json({ message: 'Stock adjusted successfully', currentStock: inventoryItem.currentStock });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get inventory logs
// @route   GET /api/branch-inventory/logs
// @access  Private
const getInventoryLogs = async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'branch') {
        const branch = await Branch.findOne({ user: req.user._id });
        query = { branch: branch._id };
    } else if (req.user.role === 'sales') {
        // Handle sales rep logs if needed, for now filtering by adjustedBy
        query = { adjustedBy: req.user._id };
    }

    const logs = await InventoryLog.find(query)
      .populate('product', 'name')
      .populate('adjustedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete inventory item
// @route   DELETE /api/branch-inventory/:id
// @access  Private
const deleteBranchInventory = async (req, res) => {
  try {
    let inventoryItem;
    if (req.user.role === 'branch') {
        inventoryItem = await BranchInventory.findById(req.params.id);
    } else if (req.user.role === 'sales') {
        inventoryItem = await SalesRepInventory.findById(req.params.id);
    }

    if (!inventoryItem) return res.status(404).json({ message: 'Item not found' });

    await inventoryItem.constructor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Item removed from inventory' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBranchInventory,
  adjustStock,
  getInventoryLogs,
  deleteBranchInventory
};

