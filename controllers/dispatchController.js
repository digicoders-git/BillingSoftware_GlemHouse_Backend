const Dispatch = require('../models/Dispatch');
const Product = require('../models/Product');
const BranchInventory = require('../models/BranchInventory');
const SalesRepInventory = require('../models/SalesRepInventory');
const DistributorInventory = require('../models/DistributorInventory');
const InventoryLog = require('../models/InventoryLog');
const Branch = require('../models/Branch');
const SalesRep = require('../models/SalesRep');
const Distributor = require('../models/Distributor');

// @desc    Create new dispatch with billing
// @route   POST /api/dispatches
// @access  Private (Admin or Branch)
const createDispatch = async (req, res) => {
  const { 
    receiverType,
    receiverId, 
    date, 
    method, 
    reference, 
    items, 
    totalItems, 
    billingType, 
    gstRate, 
    taxableAmount, 
    gstAmount, 
    totalAmount 
  } = req.body;

  if (items && items.length === 0) {
    return res.status(400).json({ message: 'No dispatch items' });
  }

  try {
    let senderType = 'Admin';
    let senderBranch = null;
    let senderSalesRep = null;
    let receiverBranch = null;
    let receiverSalesRep = null;
    let receiverDistributor = null;

    // 1. Identify Sender
    if (req.user.role === 'branch') {
      senderType = 'Branch';
      const branch = await Branch.findOne({ user: req.user._id });
      if (!branch) return res.status(404).json({ message: 'Sender branch not found' });
      senderBranch = branch._id;
    } else if (req.user.role === 'sales') {
      senderType = 'SalesRep';
      const salesRep = await SalesRep.findOne({ user: req.user._id });
      if (!salesRep) return res.status(404).json({ message: 'Sender SalesRep not found' });
      senderSalesRep = salesRep._id;
    }

    // 2. Identify Receiver
    if (receiverType === 'Branch') {
      const branchDoc = await Branch.findById(receiverId);
      if (!branchDoc) return res.status(404).json({ message: 'Receiver branch not found' });
      receiverBranch = branchDoc._id;
    } else if (receiverType === 'SalesRep') {
      const salesRepDoc = await SalesRep.findById(receiverId);
      if (!salesRepDoc) return res.status(404).json({ message: 'Receiver SalesRep not found' });
      receiverSalesRep = salesRepDoc._id;
    } else if (receiverType === 'Distributor') {
      const distributorDoc = await Distributor.findById(receiverId);
      if (!distributorDoc) return res.status(404).json({ message: 'Receiver Distributor not found' });
      receiverDistributor = distributorDoc._id;
    } else {
      return res.status(400).json({ message: 'Invalid receiver type' });
    }

    // 3. Generate Unique Invoice Number
    const lastDispatch = await Dispatch.findOne({}, {}, { sort: { 'createdAt' : -1 } });
    const lastId = lastDispatch && lastDispatch.invoiceNo ? parseInt(lastDispatch.invoiceNo.split('-')[1]) || 1000 : 1000;
    const invoiceNo = `INV-${lastId + 1}`;

    // 4. Generate Tracking Code with Branch Context
    let prefix = 'TRK';
    if (senderType === 'Branch') {
      const branch = await Branch.findById(senderBranch);
      prefix = branch.branchId || 'BRN';
    } else {
      prefix = 'MAIN'; // Main Warehouse
    }
    const trackingCode = `${prefix}-DIS-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 100)}`;

    const dispatch = new Dispatch({
      senderType,
      senderBranch,
      senderSalesRep,
      receiverType,
      receiverBranch,
      receiverSalesRep,
      receiverDistributor,
      invoiceNo,
      trackingCode,
      date,
      method,
      reference: reference || invoiceNo,
      items,
      totalItems,
      billingType,
      gstRate: gstRate || 0,
      taxableAmount,
      gstAmount: gstAmount || 0,
      totalAmount,
      status: 'Pending'
    });

    const createdDispatch = await dispatch.save();
    
    // 5. Deduct from Sender's Stock and log it
    for (const item of items) {
      if (senderType === 'Admin') {
        // Deduct from Main Product stock
        await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.qty } });
        
        await InventoryLog.create({
          product: item.product,
          type: 'Stock Out',
          quantity: item.qty,
          reason: `Admin Dispatched to ${receiverType}: ${invoiceNo} (${trackingCode})`,
          adjustedBy: req.user._id
        });
      } else if (senderType === 'Branch') {
        // VALIDATION: Check if Branch has enough stock
        const branchStock = await BranchInventory.findOne({ branch: senderBranch, product: item.product });
        if (!branchStock || branchStock.currentStock < item.qty) {
           throw new Error(`Insufficient stock for ${item.name} at branch`);
        }

        // Deduct from Branch stock
        await BranchInventory.findOneAndUpdate(
          { branch: senderBranch, product: item.product },
          { $inc: { currentStock: -item.qty } }
        );

        await InventoryLog.create({
          branch: senderBranch,
          salesRep: receiverType === 'SalesRep' ? receiverSalesRep : null,
          product: item.product,
          type: 'Stock Out',
          quantity: item.qty,
          reason: `Branch Dispatched to ${receiverType}: ${invoiceNo} (${trackingCode})`,
          adjustedBy: req.user._id
        });
      } else if (senderType === 'SalesRep') {
         // Deduct from SalesRep stock
         const salesRepStock = await SalesRepInventory.findOne({ salesRep: senderSalesRep, product: item.product });
         if (!salesRepStock || salesRepStock.currentStock < item.qty) {
            throw new Error(`Insufficient shelf stock for ${item.name}`);
         }

         await SalesRepInventory.findOneAndUpdate(
           { salesRep: senderSalesRep, product: item.product },
           { $inc: { currentStock: -item.qty } }
         );

         await InventoryLog.create({
           salesRep: senderSalesRep,
           product: item.product,
           type: 'Stock Out',
           quantity: item.qty,
           reason: `SalesRep Dispatched to ${receiverType}: ${invoiceNo} (${trackingCode})`,
           adjustedBy: req.user._id
         });
      }
    }

    res.status(201).json(createdDispatch);
  } catch (error) {
    console.error('Dispatch creation error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all dispatches
// @route   GET /api/dispatches
// @access  Private
const getDispatches = async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
            { reference: { $regex: req.query.keyword, $options: 'i' } },
            { invoiceNo: { $regex: req.query.keyword, $options: 'i' } },
            { trackingCode: { $regex: req.query.keyword, $options: 'i' } },
        ]
      }
    : {};

  let query = { ...keyword };

  // Filter based on role or specific branch/salesRep for admin
  if (req.user.role === 'branch') {
    const branch = await Branch.findOne({ user: req.user._id });
    if (branch) {
      query = { 
        ...query, 
        $or: [
          { receiverBranch: branch._id },
          { senderBranch: branch._id }
        ]
      };
    }
  } else if (req.user.role === 'sales') {
    const salesRep = await SalesRep.findOne({ user: req.user._id });
    if (salesRep) {
      query = { 
        ...query, 
        $or: [
          { receiverSalesRep: salesRep._id },
          { senderSalesRep: salesRep._id }
        ]
      };
    }
  } else if (req.user.role === 'distributor') {
    const distributor = await Distributor.findOne({ user: req.user._id });
    if (distributor) {
      query = { ...query, receiverDistributor: distributor._id };
    }
  } else if (req.user.role === 'admin') {
    if (req.query.branchId) {
      query = { 
        ...query, 
        $or: [
          { receiverBranch: req.query.branchId },
          { senderBranch: req.query.branchId }
        ]
      };
    } else if (req.query.salesRepId) {
      query = { ...query, receiverSalesRep: req.query.salesRepId };
    }
  }

  const count = await Dispatch.countDocuments(query);
  const dispatches = await Dispatch.find(query)
    .populate('receiverBranch', 'name branchId')
    .populate('senderBranch', 'name branchId')
    .populate('receiverSalesRep', 'name salesId')
    .populate('senderSalesRep', 'name salesId')
    .populate('receiverDistributor', 'name distributorId')
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ dispatches, page, pages: Math.ceil(count / pageSize), total: count });
};

// @desc    Get dispatch by ID
// @route   GET /api/dispatches/:id
// @access  Private
const getDispatchById = async (req, res) => {
  const dispatch = await Dispatch.findById(req.params.id)
    .populate('receiverBranch', 'name branchId location manager contact email')
    .populate('senderBranch', 'name branchId')
    .populate('senderSalesRep', 'name salesId')
    .populate('receiverSalesRep', 'name salesId contact email location')
    .populate('receiverDistributor', 'name distributorId contact email location')
    .populate('items.product', 'name sku');

  if (dispatch) {
    res.json(dispatch);
  } else {
    return res.status(404).json({ message: 'Dispatch record not found' });
  }
};

// @desc    Update dispatch status
// @route   PATCH /api/dispatches/:id/status
// @access  Private
const updateDispatchStatus = async (req, res) => {
  const { status, paymentStatus } = req.body;
  const dispatch = await Dispatch.findById(req.params.id);

  if (!dispatch) {
    return res.status(404).json({ message: 'Dispatch record not found' });
  }

  if (dispatch.status === 'Received' && status === 'Received') {
    return res.status(400).json({ message: 'Stock already received for this dispatch' });
  }

  if (status === 'Received') {
    for (const item of dispatch.items) {
      if (dispatch.receiverType === 'Branch') {
        await BranchInventory.findOneAndUpdate(
          { branch: dispatch.receiverBranch, product: item.product },
          { $inc: { currentStock: item.qty } },
          { upsert: true, new: true }
        );

        await InventoryLog.create({
          branch: dispatch.receiverBranch,
          product: item.product,
          type: 'Stock In',
          quantity: item.qty,
          reason: `Dispatch Received: ${dispatch.invoiceNo}`,
          adjustedBy: req.user._id
        });
      } else if (dispatch.receiverType === 'SalesRep') {
        await SalesRepInventory.findOneAndUpdate(
          { salesRep: dispatch.receiverSalesRep, product: item.product },
          { $inc: { currentStock: item.qty } },
          { upsert: true, new: true }
        );

        // Audit Log for SalesRep Stock Receipt
        await InventoryLog.create({
          salesRep: dispatch.receiverSalesRep,
          product: item.product,
          type: 'Stock In',
          quantity: item.qty,
          reason: `SalesRep Received Stock: ${dispatch.invoiceNo} (${dispatch.trackingCode})`,
          adjustedBy: req.user._id
        });
      } else if (dispatch.receiverType === 'Distributor') {
        await DistributorInventory.findOneAndUpdate(
          { distributor: dispatch.receiverDistributor, product: item.product },
          { $inc: { currentStock: item.qty } },
          { upsert: true, new: true }
        );

        await InventoryLog.create({
          distributor: dispatch.receiverDistributor,
          product: item.product,
          type: 'Stock In',
          quantity: item.qty,
          reason: `Distributor Received Stock: ${dispatch.invoiceNo}`,
          adjustedBy: req.user._id
        });
      }
    }
  }

  dispatch.status = status || dispatch.status;
  dispatch.paymentStatus = paymentStatus || dispatch.paymentStatus;
  
  const updatedDispatch = await dispatch.save();
  res.json(updatedDispatch);
};

module.exports = {
  createDispatch,
  getDispatches,
  getDispatchById,
  updateDispatchStatus,
};
