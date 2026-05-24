const Branch = require('../models/Branch');
const Dispatch = require('../models/Dispatch');
const Product = require('../models/Product');
const BranchInventory = require('../models/BranchInventory');
const Sale = require('../models/Sale');
const SalesRep = require('../models/SalesRep');
const Distributor = require('../models/Distributor');
const moment = require('moment');

// @desc    Get master dashboard data
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    // 1. Top Stats
    const totalBranches = await Branch.countDocuments() || 0;
    const totalSalesReps = await SalesRep.countDocuments() || 0;
    const totalDistributors = await Distributor.countDocuments() || 0;
    
    const dispatches = await Dispatch.find() || [];
    const sales = await Sale.find() || [];

    const totalUnitsDispatched = dispatches.reduce((sum, d) => sum + (d.totalItems || 0), 0);
    const activeTransfers = dispatches.filter(d => d.status === 'Pending').length;
    
    const totalRevenue = sales.reduce((sum, s) => sum + (s.totalAmount || 0), 0);
    const totalSalesCount = sales.length;

    const products = await Product.find({}) || [];
    const mainStock = products.reduce((sum, p) => sum + (p.stock || 0), 0);
    const totalProductTypes = products.length;
    const totalCategories = [...new Set(products.map(p => p.category).filter(c => c))].length;
    
    // Detailed Low Stock Items (WAREHOUSE ONLY - negative or below minLevel)
    const lowStockItems = products
      .filter(p => p.stock <= (p.minLevel || 5))
      .map(p => ({
        id: p._id,
        name: p.name,
        stock: p.stock,
        minLevel: p.minLevel || 5,
        category: p.category
      }))
      .slice(0, 5);

    // Low stock count based on warehouse stock
    const lowStockCount = products.filter(p => p.stock <= (p.minLevel || 5)).length;

    // 2. Chart Data (Last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days').startOf('day');
      const dateStr = date.format('YYYY-MM-DD');

      const dailyDispatches = dispatches.filter(d => 
        moment(d.date).format('YYYY-MM-DD') === dateStr
      );

      const dailySales = sales.filter(s => 
        moment(s.date).format('YYYY-MM-DD') === dateStr
      );

      chartData.push({
        name: date.format('ddd'),
        dispatches: dailyDispatches.reduce((sum, d) => sum + (d.totalItems || 0), 0),
        sales: dailySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0),
        revenue: dailySales.reduce((sum, s) => sum + (s.totalAmount || 0), 0)
      });
    }

    // Console log for debugging
    console.log('Dashboard Stats:', {
      totalBranches,
      totalSalesReps,
      totalDistributors,
      totalUnitsDispatched,
      mainStock
    });

    res.json({
      stats: {
        totalBranches,
        totalSalesReps,
        totalDistributors,
        totalUnitsDispatched,
        activeTransfers,
        totalRevenue,
        totalSalesCount,
        mainStock,
        totalProductTypes,
        totalCategories,
        lowStockCount: products.filter(p => p.stock <= (p.minLevel || 5)).length,
        lowStockItems,
        todaySales: sales.filter(s => moment(s.date).isSame(moment(), 'day')).length
      },
      chartData,
      todayDate: moment().format('MMM DD, YYYY')
    });
  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardData
};

