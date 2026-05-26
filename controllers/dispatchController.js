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
      const SalesRepDoc = await SalesRep.findById(receiverId);
      if (!SalesRepDoc) return res.status(404).json({ message: 'Receiver SalesRep not found' });
      receiverSalesRep = SalesRepDoc._id;
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
    
    // 5. Verify stock FIRST for all items before any database mutation
    for (const item of items) {
      const qtyNum = Number(item.qty) || 0;
      if (qtyNum <= 0) {
        return res.status(400).json({ message: `Quantity for ${item.name || 'product'} must be greater than zero` });
      }

      if (senderType === 'Admin') {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(404).json({ message: `Product ${item.name || 'product'} not found` });
        }
        if (billingType !== 'Transfer' && product.stock < qtyNum) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${product.name} in Central Warehouse. Available: ${product.stock}` 
          });
        }
      } else if (senderType === 'Branch') {
        const branchStock = await BranchInventory.findOne({ branch: senderBranch, product: item.product });
        if (!branchStock || branchStock.currentStock < qtyNum) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${item.name || 'product'} at branch. Available: ${branchStock ? branchStock.currentStock : 0}` 
          });
        }
      } else if (senderType === 'SalesRep') {
        const SalesRepStock = await SalesRepInventory.findOne({ SalesRep: senderSalesRep, product: item.product });
        if (!SalesRepStock || SalesRepStock.currentStock < qtyNum) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${item.name || 'product'} in Sales Rep shelf stock. Available: ${SalesRepStock ? SalesRepStock.currentStock : 0}` 
          });
        }
      }
    }

    // 6. Deduct from Sender's Stock and log it (Safe because validation passed for all items)
    for (const item of items) {
      const qtyNum = Number(item.qty);
      if (senderType === 'Admin') {
        // Deduct from Main Product stock for all dispatch types EXCEPT Transfer
        if (billingType !== 'Transfer') {
          await Product.findByIdAndUpdate(item.product, { $inc: { stock: -qtyNum } });
        }

        if (billingType !== 'Transfer') {
          await InventoryLog.create({
            product: item.product,
            type: 'Stock Out',
            quantity: qtyNum,
            reason: `Admin Dispatched to ${receiverType}: ${invoiceNo} (${trackingCode})`,
            adjustedBy: req.user._id
          });
        } else {
          await InventoryLog.create({
            product: item.product,
            type: 'Transfer Out',
            quantity: qtyNum,
            reason: `Admin Transferred to ${receiverType}: ${invoiceNo} (${trackingCode})`,
            adjustedBy: req.user._id
          });
        }
      } else if (senderType === 'Branch') {
        // Deduct from Branch stock
        await BranchInventory.findOneAndUpdate(
          { branch: senderBranch, product: item.product },
          { $inc: { currentStock: -qtyNum } }
        );

        await InventoryLog.create({
          branch: senderBranch,
          SalesRep: receiverType === 'SalesRep' ? receiverSalesRep : null,
          product: item.product,
          type: 'Stock Out',
          quantity: qtyNum,
          reason: `Branch Dispatched to ${receiverType}: ${invoiceNo} (${trackingCode})`,
          adjustedBy: req.user._id
        });
      } else if (senderType === 'SalesRep') {
         // Deduct from SalesRep stock
         await SalesRepInventory.findOneAndUpdate(
           { SalesRep: senderSalesRep, product: item.product },
           { $inc: { currentStock: -qtyNum } }
         );

         await InventoryLog.create({
           SalesRep: senderSalesRep,
           product: item.product,
           type: 'Stock Out',
           quantity: qtyNum,
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

  // Filter based on role or specific branch/SalesRep for admin
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
    } else if (req.query.SalesRepId) {
      query = { ...query, receiverSalesRep: req.query.SalesRepId };
    }
  }

  const count = await Dispatch.countDocuments(query);
  const dispatches = await Dispatch.find(query)
    .populate('receiverBranch', 'name branchId')
    .populate('senderBranch', 'name branchId')
    .populate('receiverSalesRep', 'name salesId')
    .populate('senderSalesRep', 'name salesId')
    .populate('receiverDistributor', 'name distributorId')
    .populate('items.product', 'name sku hsn batch')
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
    .populate('items.product', 'name sku hsn batch');

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

        if (dispatch.billingType !== 'Transfer') {
          await InventoryLog.create({
            branch: dispatch.receiverBranch,
            product: item.product,
            type: 'Stock In',
            quantity: item.qty,
            reason: `Dispatch Received: ${dispatch.invoiceNo}`,
            adjustedBy: req.user._id
          });
        } else {
          await InventoryLog.create({
            branch: dispatch.receiverBranch,
            product: item.product,
            type: 'Transfer In',
            quantity: item.qty,
            reason: `Transfer Received from Admin: ${dispatch.invoiceNo}`,
            adjustedBy: req.user._id
          });
        }
      } else if (dispatch.receiverType === 'SalesRep') {
        await SalesRepInventory.findOneAndUpdate(
          { SalesRep: dispatch.receiverSalesRep, product: item.product },
          { $inc: { currentStock: item.qty } },
          { upsert: true, new: true }
        );

        // Audit Log for SalesRep Stock Receipt
        await InventoryLog.create({
          SalesRep: dispatch.receiverSalesRep,
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

