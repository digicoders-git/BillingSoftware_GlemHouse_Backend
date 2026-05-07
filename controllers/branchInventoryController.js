const BranchInventory = require('../models/BranchInventory');
const Branch = require('../models/Branch');
const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');

// @desc    Get inventory for current branch
// @route   GET /api/branch-inventory
// @access  Private/Branch
const getBranchInventory = async (req, res) => {
  try {
    // Find branch associated with the user
    const branch = await Branch.findOne({ user: req.user._id });
    if (!branch) {
      return res.status(404).json({ message: 'Branch not found for this user' });
    }

    const inventory = await BranchInventory.find({ branch: branch._id })
      .populate('product', 'name category price sku image minLevel');

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
      branchName: branch.name
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
    const inventoryItem = await BranchInventory.findById(req.params.id);

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
      branch: inventoryItem.branch,
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

// @desc    Get inventory logs for current branch
// @route   GET /api/branch-inventory/logs
// @access  Private/Branch
const getInventoryLogs = async (req, res) => {
  try {
    const branch = await Branch.findOne({ user: req.user._id });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const logs = await InventoryLog.find({ branch: branch._id })
      .populate('product', 'name')
      .populate('adjustedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete branch inventory item
// @route   DELETE /api/branch-inventory/:id
// @access  Private/Branch
const deleteBranchInventory = async (req, res) => {
  try {
    const inventoryItem = await BranchInventory.findById(req.params.id);
    if (!inventoryItem) return res.status(404).json({ message: 'Item not found' });

    // Ensure it belongs to the branch
    const branch = await Branch.findOne({ user: req.user._id });
    if (inventoryItem.branch.toString() !== branch._id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await BranchInventory.findByIdAndDelete(req.params.id);
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
