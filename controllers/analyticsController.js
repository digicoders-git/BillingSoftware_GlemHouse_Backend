const Dispatch = require('../models/Dispatch');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const BranchInventory = require('../models/BranchInventory');

// @desc    Get product allocation data for branches
// @route   GET /api/analytics/allocation
// @access  Private
const getAllocationData = async (req, res) => {
  try {
    // Aggregate stock by branch
    const branches = await Branch.find({});
    const products = await Product.find({});
    
    // Get all inventory records
    const inventory = await BranchInventory.find({}).populate('branch product');

    // Prepare data for the table
    // For simplicity, let's group by branch
    const branchAllocation = await Promise.all(branches.map(async (branch) => {
      const branchStock = await BranchInventory.find({ branch: branch._id });
      const totalAllocated = branchStock.reduce((sum, item) => sum + item.currentStock, 0);
      
      return {
        branch: branch.name,
        branchId: branch.branchId,
        allocated: totalAllocated,
        total: 1000, // Dummy capacity for now
        percentage: Math.min(Math.round((totalAllocated / 1000) * 100), 100),
        status: totalAllocated > 900 ? 'Critical' : totalAllocated > 700 ? 'Optimal' : 'Good'
      };
    }));

    // Data for the pie chart (Allocated stock by category)
    const categoryData = await BranchInventory.aggregate([
      {
        $lookup: {
          from: 'products',
          localField: 'product',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: '$productInfo' },
      {
        $group: {
          _id: '$productInfo.category',
          value: { $sum: '$currentStock' }
        }
      },
      { $project: { name: '$_id', value: 1, _id: 0 } }
    ]);

    // If no stock allocated yet, fall back to product count or empty
    const finalCategoryData = categoryData.length > 0 ? categoryData : [
      { name: 'No Stock', value: 1 }
    ];

    // Data for the bar chart (stock by branch)
    const barData = branchAllocation.map(b => ({
      name: b.branch.split(' ')[0],
      stock: b.allocated
    }));

    // Stats
    const totalDispatched = await Dispatch.aggregate([{ $group: { _id: null, total: { $sum: "$totalItems" } } }]);
    
    res.json({
      branchAllocation,
      categoryData: finalCategoryData,
      barData,
      stats: {
        totalAllocated: totalDispatched[0]?.total || 0,
        topBranch: branchAllocation.sort((a, b) => b.allocated - a.allocated)[0]?.branch || 'N/A',
        utilization: '85%', // Dummy
        understocked: branchAllocation.filter(b => b.allocated < 200).length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get product movement log
// @route   GET /api/analytics/movement
// @access  Private
const getMovementData = async (req, res) => {
  try {
    // Movements are basically dispatches for now
    const dispatches = await Dispatch.find({})
      .populate('branch', 'name')
      .sort({ createdAt: -1 })
      .limit(20);

    const movements = dispatches.map(d => ({
      id: d._id,
      date: d.date,
      branch: d.branch?.name,
      type: 'Dispatch',
      items: d.totalItems,
      value: d.totalValue,
      status: d.status
    }));

    res.json(movements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllocationData,
  getMovementData,
};
