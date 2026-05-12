const DistributorInventory = require('../models/DistributorInventory');
const Distributor = require('../models/Distributor');
const InventoryLog = require('../models/InventoryLog');

// @desc    Get inventory for current distributor
// @route   GET /api/distributor-inventory
// @access  Private (Distributor)
const getDistributorInventory = async (req, res) => {
  try {
    let distributorId = '';
    let name = '';

    if (req.user.role === 'distributor') {
      const distributor = await Distributor.findOne({ user: req.user._id });
      if (!distributor) return res.status(404).json({ message: 'Distributor not found' });
      distributorId = distributor._id;
      name = distributor.name;
    } else if (req.user.role === 'admin' && req.query.distributorId) {
      distributorId = req.query.distributorId;
      const distributor = await Distributor.findById(distributorId);
      name = distributor?.name || 'Distributor';
    } else {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const inventory = await DistributorInventory.find({ distributor: distributorId })
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
      name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDistributorInventory
};
