const Dispatch = require('../models/Dispatch');
const Product = require('../models/Product');
const BranchInventory = require('../models/BranchInventory');
const InventoryLog = require('../models/InventoryLog');
const Branch = require('../models/Branch');

// @desc    Create new dispatch
// @route   POST /api/dispatches
// @access  Private/Admin
const createDispatch = async (req, res) => {
  const { branch, date, method, reference, items, totalItems, totalValue } = req.body;

  if (items && items.length === 0) {
    return res.status(400).json({ message: 'No dispatch items' });
  } else {
    const dispatch = new Dispatch({
      branch,
      date,
      method,
      reference,
      items,
      totalItems,
      totalValue,
      status: 'Pending' // Explicitly set as Pending
    });

    const createdDispatch = await dispatch.save();
    
    // 1. Deduct from Admin Product Stock immediately
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.qty }
      });
    }

    res.status(201).json(createdDispatch);
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
        reference: { $regex: req.query.keyword, $options: 'i' },
      }
    : {};

  let branchQuery = {};
  if (req.user && req.user.role === 'branch') {
    const branch = await Branch.findOne({ user: req.user._id });
    if (branch) {
      branchQuery = { branch: branch._id };
    }
  } else if (req.query.branchId) {
    branchQuery = { branch: req.query.branchId };
  }

  const count = await Dispatch.countDocuments({ ...keyword, ...branchQuery });
  const dispatches = await Dispatch.find({ ...keyword, ...branchQuery })
    .populate('branch', 'name branchId')
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
    .populate('branch', 'name branchId location manager contact email')
    .populate('items.product', 'name sku');

  if (dispatch) {
    res.json(dispatch);
  } else {
    return res.status(404).json({ message: 'Dispatch record not found' });
  }
};

// @desc    Update dispatch status (e.g. Received)
// @route   PATCH /api/dispatches/:id/status
// @access  Private
const updateDispatchStatus = async (req, res) => {
  const { status } = req.body;
  const dispatch = await Dispatch.findById(req.params.id);

  if (!dispatch) {
    return res.status(404).json({ message: 'Dispatch record not found' });
  }

  // If already received, don't process again
  if (dispatch.status === 'Received' && status === 'Received') {
    return res.status(400).json({ message: 'Stock already received for this dispatch' });
  }

  // Logic for 'Received' status: Sync with Branch Inventory
  if (status === 'Received') {
    for (const item of dispatch.items) {
      // 1. Add to Branch Inventory
      await BranchInventory.findOneAndUpdate(
        { branch: dispatch.branch, product: item.product },
        { $inc: { currentStock: item.qty } },
        { upsert: true, new: true }
      );

      // 2. Create Inventory Log for Branch
      await InventoryLog.create({
        branch: dispatch.branch,
        product: item.product,
        type: 'Stock In',
        quantity: item.qty,
        reason: `Dispatch Received: ${dispatch.reference}`,
        adjustedBy: req.user._id
      });
    }
  }

  dispatch.status = status || dispatch.status;
  const updatedDispatch = await dispatch.save();
  res.json(updatedDispatch);
};

module.exports = {
  createDispatch,
  getDispatches,
  getDispatchById,
  updateDispatchStatus,
};
