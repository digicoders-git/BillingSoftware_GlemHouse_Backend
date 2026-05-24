const Sale = require('../models/Sale');
const Dispatch = require('../models/Dispatch');
const Branch = require('../models/Branch');
const SalesRep = require('../models/SalesRep');
const BranchInventory = require('../models/BranchInventory');
const SalesRepInventory = require('../models/SalesRepInventory');
const Distributor = require('../models/Distributor');
const DistributorInventory = require('../models/DistributorInventory');
const InventoryLog = require('../models/InventoryLog');
const moment = require('moment');

// @desc    Get sales history for current branch or SalesRep
// @route   GET /api/branch-sales
// @access  Private
const getBranchSales = async (req, res) => {
  try {
    let query = {};
    let dispatchQuery = null;
    if (req.user.role === 'branch') {
      const branch = await Branch.findOne({ user: req.user._id });
      if (!branch) return res.status(404).json({ message: 'Branch not found' });
      query = { branch: branch._id };
      dispatchQuery = { senderBranch: branch._id };
    } else if (req.user.role === 'sales') {
      const salesRep = await SalesRep.findOne({ user: req.user._id });
      if (!salesRep) return res.status(404).json({ message: 'sales Rep not found' });
      query = { SalesRep: salesRep._id };
      dispatchQuery = { senderSalesRep: salesRep._id };
    } else if (req.user.role === 'distributor') {
      const distributor = await Distributor.findOne({ user: req.user._id });
      if (!distributor) return res.status(404).json({ message: 'Distributor not found' });
      query = { distributor: distributor._id };
    } else {
        // Admin sees all
        query = {};
        dispatchQuery = {};
    }

    const [salesRaw, dispatchesRaw] = await Promise.all([
      Sale.find(query)
        .populate('branch', 'name')
        .populate('SalesRep', 'name')
        .populate('distributor', 'name')
        .sort({ createdAt: -1 }),
      dispatchQuery ? Dispatch.find(dispatchQuery).sort({ createdAt: -1 }) : Promise.resolve([])
    ]);

    const rawSales = salesRaw.map(s => ({
      _id: s._id, invoiceId: s.invoiceId, customerName: s.customerName, customerPhone: s.customerPhone,
      items: s.items, billingType: s.billingType, gstRate: s.gstRate, taxableAmount: s.taxableAmount,
      gstAmount: s.gstAmount, discount: s.discount, totalQty: s.totalQty, totalAmount: s.totalAmount,
      createdAt: s.createdAt, date: s.date, sellerType: s.sellerType, branch: s.branch, SalesRep: s.SalesRep, distributor: s.distributor
    }));

    const rawDispatches = dispatchesRaw.map(d => ({
      _id: d._id, invoiceId: d.invoiceNo, customerName: `Dispatch to ${d.receiverType}`, customerPhone: '-',
      items: d.items.map(i => ({ name: i.name, qty: i.qty, price: i.price, product: i.product })),
      billingType: d.billingType, gstRate: d.gstRate, taxableAmount: d.taxableAmount, gstAmount: d.gstAmount,
      discount: 0, totalQty: d.totalItems, totalAmount: d.totalAmount, createdAt: d.createdAt, date: d.date || d.createdAt,
      sellerType: d.senderType, branch: null, SalesRep: null, distributor: null
    }));

    const sales = [...rawSales, ...rawDispatches].sort((a, b) => new Date(b.date) - new Date(a.date));

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
      if (p.lastWeekSales > 0) {
        p.growth = Math.round(((p.sales - p.lastWeekSales) / p.lastWeekSales) * 100);
      } else {
        p.growth = p.sales > 0 ? 100 : 0;
      }
      if (p.growth > 10) p.status = 'Increasing';
      else if (p.growth < -10) p.status = 'Decreasing';
      else p.status = 'Stable';
      return p;
    });

    // Calculate weekly trend
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
        customerPhone: s.customerPhone,
        products: s.items.map(i => i.name).join(', '),
        items: s.items,
        billingType: s.billingType,
        gstRate: s.gstRate,
        taxableAmount: s.taxableAmount,
        gstAmount: s.gstAmount,
        discount: s.discount,
        totalQty: s.totalQty,
        totalAmount: s.totalAmount,
        createdAt: s.createdAt,
        time: moment(s.date).format('hh:mm A'),
        date: moment(s.date).format('YYYY-MM-DD'),
        sellerType: s.sellerType,
        seller: s.sellerType === 'Branch' ? (s.branch?.name || 'Branch') : (s.sellerType === 'SalesRep' ? (s.SalesRep?.name || 'sales Rep') : (s.distributor?.name || 'Distributor'))
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
// @access  Private
const createSale = async (req, res) => {
  try {
    const { 
      customerName, 
      customerPhone,
      items, 
      paymentMethod,
      billingType,
      gstRate,
      taxableAmount,
      gstAmount,
      discount,
      totalAmount,
      notes
    } = req.body;

    let sellerType = 'Branch';
    let sellerId = null;
    let inventoryModel = BranchInventory;
    let inventoryQuery = {};

    if (req.user.role === 'branch') {
      const branch = await Branch.findOne({ user: req.user._id });
      if (!branch) return res.status(404).json({ message: 'Branch not found' });
      sellerId = branch._id;
      inventoryQuery = { branch: branch._id };
    } else if (req.user.role === 'sales') {
      sellerType = 'SalesRep';
      const salesRep = await SalesRep.findOne({ user: req.user._id });
      if (!salesRep) return res.status(404).json({ message: 'sales Rep not found' });
      sellerId = salesRep._id;
      inventoryModel = SalesRepInventory;
      inventoryQuery = { SalesRep: salesRep._id };
    } else if (req.user.role === 'distributor') {
      sellerType = 'Distributor';
      const distributor = await Distributor.findOne({ user: req.user._id });
      if (!distributor) return res.status(404).json({ message: 'Distributor not found' });
      sellerId = distributor._id;
      inventoryModel = DistributorInventory;
      inventoryQuery = { distributor: distributor._id };
    }

    let totalQty = 0;

    // Verify stock
    for (const item of items) {
      const inventory = await inventoryModel.findOne({ ...inventoryQuery, product: item.product });
      if (!inventory || inventory.currentStock < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${item.name}` });
      }
    }

    // Deduct stock
    for (const item of items) {
      const inventory = await inventoryModel.findOne({ ...inventoryQuery, product: item.product });
      inventory.currentStock -= item.qty;
      await inventory.save();
      totalQty += Number(item.qty);
    }

    const sale = await Sale.create({
      sellerType,
      branch: sellerType === 'Branch' ? sellerId : null,
      SalesRep: sellerType === 'SalesRep' ? sellerId : null,
      distributor: sellerType === 'Distributor' ? sellerId : null,
      invoiceId: `INV-${Date.now().toString().slice(-6)}`,
      customerName,
      customerPhone,
      items,
      billingType: billingType || 'Without GST',
      gstRate: gstRate || 0,
      taxableAmount: taxableAmount || 0,
      gstAmount: gstAmount || 0,
      discount: discount || 0,
      totalQty,
      totalAmount,
      paymentMethod: paymentMethod || 'Cash',
      notes
    });

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get reports with filters
// @route   GET /api/branch-sales/reports
// @access  Private
const getBranchReport = async (req, res) => {
  try {
    const { startDate, endDate, type } = req.query;
    let query = {};
    let dispatchQuery = null;

    if (req.user.role === 'branch') {
        const branch = await Branch.findOne({ user: req.user._id });
        query = { branch: branch._id };
        dispatchQuery = { senderBranch: branch._id };
    } else if (req.user.role === 'sales') {
        const salesRep = await SalesRep.findOne({ user: req.user._id });
        query = { SalesRep: salesRep._id };
        dispatchQuery = { senderSalesRep: salesRep._id };
    } else if (req.user.role === 'distributor') {
        const distributor = await Distributor.findOne({ user: req.user._id });
        query = { distributor: distributor._id };
    }

    if (startDate && endDate) {
      query.date = { 
        $gte: moment(startDate).startOf('day').toDate(), 
        $lte: moment(endDate).endOf('day').toDate() 
      };
      if (dispatchQuery) {
        dispatchQuery.date = query.date;
      }
    }

    const [salesRaw, dispatchesRaw] = await Promise.all([
      Sale.find(query).sort({ date: -1 }),
      dispatchQuery ? Dispatch.find(dispatchQuery).sort({ date: -1 }) : Promise.resolve([])
    ]);

    const rawSales = salesRaw.map(s => ({
      _id: s._id, invoiceId: s.invoiceId, customerName: s.customerName, items: s.items,
      totalQty: s.totalQty, totalAmount: s.totalAmount, date: s.date, paymentMethod: s.paymentMethod
    }));

    const rawDispatches = dispatchesRaw.map(d => ({
      _id: d._id, invoiceId: d.invoiceNo, customerName: `Dispatch to ${d.receiverType}`, 
      items: d.items.map(i => ({ name: i.name, qty: i.qty, price: i.price, product: i.product })),
      totalQty: d.totalItems, totalAmount: d.totalAmount, date: d.date || d.createdAt, paymentMethod: 'Transfer'
    }));

    const sales = [...rawSales, ...rawDispatches].sort((a, b) => new Date(b.date) - new Date(a.date));

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

    if (type === 'products') {
      const productMap = {};
      sales.forEach(s => {
        s.items.forEach(item => {
          if (!productMap[item.name]) {
            productMap[item.name] = { "Product Name": item.name, "Total Sold": 0, "Total sales": 0 };
          }
          productMap[item.name]["Total Sold"] += item.qty;
          productMap[item.name]["Total sales"] += (item.qty * item.price);
        });
      });
      return res.json(Object.values(productMap));
    }

    if (type === 'category') {
      // Assuming products have categories, but since items array might not have category, 
      // we'll group by a dummy "Retail" for now or use product info if available.
      // Since items in Sale model don't have category, we just return a summary.
      const reportData = [
        { "Category": "General Retail", "Transactions": sales.length, "Revenue": sales.reduce((sum, s) => sum + s.totalAmount, 0) }
      ];
      return res.json(reportData);
    }

    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard data
// @route   GET /api/branch-sales/dashboard
// @access  Private
const getBranchDashboard = async (req, res) => {
  try {
    let query = {};
    let dispatchQuery = null;
    let inventoryQuery = {};
    let inventoryModel = BranchInventory;
    let name = '';

    if (req.user.role === 'branch') {
      const branch = await Branch.findOne({ user: req.user._id });
      if (!branch) return res.status(404).json({ message: 'Branch not found' });
      query = { branch: branch._id };
      dispatchQuery = { senderBranch: branch._id };
      inventoryQuery = { branch: branch._id };
      name = branch.name;
    } else if (req.user.role === 'sales') {
      const salesRep = await SalesRep.findOne({ user: req.user._id });
      if (!salesRep) return res.status(404).json({ message: 'sales Rep not found' });
      query = { SalesRep: salesRep._id };
      dispatchQuery = { senderSalesRep: salesRep._id };
      inventoryQuery = { SalesRep: salesRep._id };
      inventoryModel = SalesRepInventory;
      name = salesRep.name;
    } else if (req.user.role === 'distributor') {
      const distributor = await Distributor.findOne({ user: req.user._id });
      if (!distributor) return res.status(404).json({ message: 'Distributor not found' });
      query = { distributor: distributor._id };
      inventoryQuery = { distributor: distributor._id };
      inventoryModel = DistributorInventory;
      name = distributor.name;
    }

    const [salesRaw, dispatchesRaw] = await Promise.all([
      Sale.find(query).sort({ date: -1 }),
      dispatchQuery ? Dispatch.find(dispatchQuery).sort({ date: -1 }) : Promise.resolve([])
    ]);

    const rawSales = salesRaw.map(s => ({
      _id: s._id, invoiceId: s.invoiceId, customerName: s.customerName, customerPhone: s.customerPhone,
      items: s.items, totalQty: s.totalQty, totalAmount: s.totalAmount, date: s.date
    }));

    const rawDispatches = dispatchesRaw.map(d => ({
      _id: d._id, invoiceId: d.invoiceNo, customerName: `Dispatch to ${d.receiverType}`, customerPhone: '-',
      items: d.items.map(i => ({ name: i.name, qty: i.qty, price: i.price, product: i.product })),
      totalQty: d.totalItems, totalAmount: d.totalAmount, date: d.date || d.createdAt
    }));

    const sales = [...rawSales, ...rawDispatches].sort((a, b) => new Date(b.date) - new Date(a.date));
    const today = moment().startOf('day');
    const todaySales = sales.filter(s => moment(s.date).isSameOrAfter(today));
    const todayRevenue = todaySales.reduce((sum, s) => sum + s.totalAmount, 0);
    const todayQty = todaySales.reduce((sum, s) => sum + s.totalQty, 0);
    const totalCustomers = new Set(sales.map(s => s.customerPhone || s.customerName)).size;

    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = moment().subtract(i, 'days');
      const dateStr = date.format('YYYY-MM-DD');
      const dayRev = sales
        .filter(s => moment(s.date).format('YYYY-MM-DD') === dateStr)
        .reduce((sum, s) => sum + s.totalAmount, 0);
      weeklyTrend.push({ name: date.format('ddd'), sales: dayRev });
    }

    const inventory = await inventoryModel.find(inventoryQuery).populate('product', 'price minLevel');
    const totalItems = inventory.reduce((sum, item) => sum + item.currentStock, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * (item.product?.price || 0)), 0);
    const lowStockCount = inventory.filter(item => item.currentStock > 0 && item.currentStock <= (item.product?.minLevel || 5)).length;

    res.json({
      name,
      stats: {
        totalItems,
        totalProducts: inventory.length,
        totalValue,
        lowStockCount,
        todayRevenue,
        todayQty,
        totalSales: sales.length,
        totalCustomers
      },
      weeklyTrend,
      recentSales: sales.slice(0, 5).map(s => ({
        invoiceId: s.invoiceId,
        customerName: s.customerName,
        amount: s.totalAmount,
        time: moment(s.date).fromNow()
      })),
      topProducts: Object.values(
        sales.reduce((acc, sale) => {
          sale.items.forEach(item => {
            if (!acc[item.name]) acc[item.name] = { name: item.name, qty: 0, revenue: 0 };
            acc[item.name].qty += item.qty;
            acc[item.name].revenue += (item.qty * item.price);
          });
          return acc;
        }, {})
      ).sort((a, b) => b.qty - a.qty).slice(0, 5),
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

