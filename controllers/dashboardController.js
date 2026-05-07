const Branch = require('../models/Branch');
const Dispatch = require('../models/Dispatch');
const Product = require('../models/Product');
const BranchInventory = require('../models/BranchInventory');
const Sale = require('../models/Sale');
const moment = require('moment');

// @desc    Get master dashboard data
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    // 1. Top Stats
    const totalBranches = await Branch.countDocuments();
    
    const dispatches = await Dispatch.find();
    const sales = await Sale.find();

    const totalUnitsDispatched = dispatches.reduce((sum, d) => sum + d.totalItems, 0);
    const activeTransfers = dispatches.filter(d => d.status === 'Pending').length;
    
    const totalRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalSalesCount = sales.length;

    // 2. Chart Data (Last 7 days - Combining Dispatches and Sales)
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
        dispatches: dailyDispatches.reduce((sum, d) => sum + d.totalItems, 0),
        sales: dailySales.reduce((sum, s) => sum + s.totalAmount, 0)
      });
    }

    res.json({
      stats: {
        totalBranches,
        totalUnitsDispatched,
        activeTransfers,
        totalRevenue,
        totalSalesCount,
        todaySales: sales.filter(s => moment(s.date).isSame(moment(), 'day')).length
      },
      chartData,
      todayDate: moment().format('MMM DD, YYYY')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDashboardData
};
