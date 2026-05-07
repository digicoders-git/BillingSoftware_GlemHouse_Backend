const Sale = require('../models/Sale');
const Branch = require('../models/Branch');
const BranchInventory = require('../models/BranchInventory');
const moment = require('moment');

// @desc    Get sales history for current branch
// @route   GET /api/branch-sales
// @access  Private/Branch
const getBranchSales = async (req, res) => {
  try {
    const branch = await Branch.findOne({ user: req.user._id });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    const sales = await Sale.find({ branch: branch._id }).sort({ createdAt: -1 });

    const totalSold = sales.reduce((sum, s) => sum + s.totalQty, 0);
    const revenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const avgValue = sales.length > 0 ? (revenue / sales.length).toFixed(2) : 0;

    // Calculate product-wise sales
    const productMap = {};
    sales.forEach(s => {
      s.items.forEach(item => {
        const prodId = item.product ? item.product.toString() : 'unknown';
        const key = prodId + '-' + item.name;
        if (!productMap[key]) {
          productMap[key] = { 
            id: prodId,
            name: item.name, 
            sales: 0, 
            revenue: 0, 
            growth: 0, 
            status: 'Stable',
            lastWeekSales: 0 
          };
        }
        
        // Simple growth logic: Compare sales in last 7 days vs previous 7 days
        const isLast7Days = moment(s.date).isAfter(moment().subtract(7, 'days'));
        const isPrev7Days = moment(s.date).isBetween(moment().subtract(14, 'days'), moment().subtract(7, 'days'));
        
        if (isLast7Days) {
          productMap[key].sales += item.qty;
          productMap[key].revenue += item.total || (item.qty * item.price);
        } else if (isPrev7Days) {
          productMap[key].lastWeekSales += item.qty;
        }
      });
    });

    const productWise = Object.values(productMap).map(p => {
      // Calculate growth percentage
      if (p.lastWeekSales > 0) {
        p.growth = Math.round(((p.sales - p.lastWeekSales) / p.lastWeekSales) * 100);
      } else {
        p.growth = p.sales > 0 ? 100 : 0; // 100% growth if it's new
      }

      if (p.growth > 10) p.status = 'Increasing';
      else if (p.growth < -10) p.status = 'Decreasing';
      else p.status = 'Stable';
      
      return p;
    });

    // Calculate weekly trend (Last 7 days)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      const dayName = date.format('ddd');
      const dayDate = date.format('YYYY-MM-DD');
      
      const daySales = sales
        .filter(s => moment(s.date).format('YYYY-MM-DD') === dayDate)
        .reduce((sum, s) => sum + s.totalQty, 0);
      
      weeklyTrend.push({ day: dayName, sales: daySales });
    }

    res.json({
      sales: sales.map(s => ({
        _id: s._id,
        invoiceId: s.invoiceId,
        customerName: s.customerName,
        products: s.items.map(i => i.name).join(', '),
        items: s.items,
        totalQty: s.totalQty,
        totalAmount: s.totalAmount,
        time: moment(s.date).format('hh:mm A'),
        date: moment(s.date).format('YYYY-MM-DD')
      })),
      productWise,
      weeklyTrend,
      stats: {
        totalSold,
        revenue,
        invoiceCount: sales.length,
        avgValue
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new sale
// @route   POST /api/branch-sales
// @access  Private/Branch
const createSale = async (req, res) => {
  try {
    const { customerName, items, paymentMethod } = req.body;
    const branch = await Branch.findOne({ user: req.user._id });

    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    let totalQty = 0;
    let totalAmount = 0;

    // First pass: Verify all items have sufficient stock and valid quantities
    for (const item of items) {
      if (item.qty <= 0) {
        return res.status(400).json({ message: `Invalid quantity for ${item.name || 'an item'}` });
      }
      const inventory = await BranchInventory.findOne({ branch: branch._id, product: item.product });
      if (!inventory || inventory.currentStock < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name || 'an item'}` });
      }
    }

    // Second pass: Deduct from inventory and calculate totals
    for (const item of items) {
      const inventory = await BranchInventory.findOne({ branch: branch._id, product: item.product });
      inventory.currentStock -= item.qty;
      await inventory.save();

      totalQty += Number(item.qty);
      totalAmount += (Number(item.qty) * Number(item.price));
    }

    const sale = await Sale.create({
      branch: branch._id,
      invoiceId: `INV-${Date.now().toString().slice(-6)}`,
      customerName,
      items,
      totalQty,
      totalAmount,
      paymentMethod: paymentMethod || 'Cash'
    });

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get branch reports with filters
// @route   GET /api/branch-sales/reports
// @access  Private/Branch
const getBranchReport = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    const branch = await Branch.findOne({ user: req.user._id });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    let query = { branch: branch._id };
    if (startDate && endDate) {
      query.date = { 
        $gte: moment(startDate).startOf('day').toDate(), 
        $lte: moment(endDate).endOf('day').toDate() 
      };
    }

    const sales = await Sale.find(query).sort({ date: -1 });

    if (type === 'sales') {
      const reportData = sales.map(s => ({
        "Date": moment(s.date).format('YYYY-MM-DD'),
        "Invoice ID": s.invoiceId,
        "Customer": s.customerName,
        "Qty": s.totalQty,
        "Amount": s.totalAmount,
        "Method": s.paymentMethod
      }));
      return res.json(reportData);
    }

    if (type === 'category') {
      const categoryMap = {};
      sales.forEach(s => {
        s.items.forEach(item => {
          const cat = item.category || 'General'; 
          if (!categoryMap[cat]) categoryMap[cat] = { "Category": cat, "Units Sold": 0, "Revenue": 0 };
          categoryMap[cat]["Units Sold"] += item.qty;
          categoryMap[cat]["Revenue"] += item.total || (item.qty * item.price);
        });
      });
      return res.json(Object.values(categoryMap));
    }

    if (type === 'products') {
      const productMap = {};
      sales.forEach(s => {
        s.items.forEach(item => {
          if (!productMap[item.name]) productMap[item.name] = { "Product Name": item.name, "Category": item.category || 'N/A', "Units": 0, "Total Sales": 0 };
          productMap[item.name]["Units"] += item.qty;
          productMap[item.name]["Total Sales"] += item.total || (item.qty * item.price);
        });
      });
      return res.json(Object.values(productMap));
    }

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get branch dashboard data
// @route   GET /api/branch-sales/dashboard
// @access  Private/Branch
const getBranchDashboard = async (req, res) => {
  try {
    const branch = await Branch.findOne({ user: req.user._id });
    if (!branch) return res.status(404).json({ message: 'Branch not found' });

    // 1. Get all sales for this branch
    const sales = await Sale.find({ branch: branch._id }).sort({ date: -1 });

    // 2. Today's stats
    const today = moment().startOf('day');
    const todaySales = sales.filter(s => moment(s.date).isSameOrAfter(today));
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayQty = todaySales.reduce((sum, s) => sum + s.totalQty, 0);

    // 3. Weekly trend (last 7 days including today)
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      const dayName = date.format('ddd');
      
      const dayRev = sales
        .filter(s => moment(s.date).format('YYYY-MM-DD') === dateStr)
        .reduce((sum, s) => sum + s.totalAmount, 0);
      
      weeklyTrend.push({ name: dayName, sales: dayRev });
    }

    // 4. Inventory stats
    const inventory = await BranchInventory.find({ branch: branch._id })
      .populate('product', 'price minLevel');
    
    const totalItems = inventory.reduce((sum, item) => sum + item.currentStock, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * (item.product?.price || 0)), 0);
    const lowStockCount = inventory.filter(item => item.currentStock > 0 && item.currentStock <= (item.product?.minLevel || 5)).length;
    const outOfStockCount = inventory.filter(item => item.currentStock === 0).length;

    res.json({
      branchName: branch.name,
      stats: {
        totalItems,
        totalValue,
        lowStockCount,
        outOfStockCount,
        todayRevenue,
        todayQty,
        totalSales: sales.length
      },
      weeklyTrend,
      recentSales: sales.slice(0, 5).map(s => ({
        invoiceId: s.invoiceId,
        customerName: s.customerName,
        amount: s.totalAmount,
        time: moment(s.date).fromNow()
      })),
      lowStockPreview: inventory
        .filter(item => item.currentStock <= (item.product?.minLevel || 5))
        .sort((a, b) => a.currentStock - b.currentStock)
        .slice(0, 5)
        .map(item => ({
          name: item.product?.name || 'Unknown',
          stock: item.currentStock,
          status: item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'
        }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBranchSales,
  createSale,
  getBranchReport,
  getBranchDashboard
};
