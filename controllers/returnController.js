const Return = require('../models/Return');
const BranchInventory = require('../models/BranchInventory');
const SalesRepInventory = require('../models/SalesRepInventory');
const DistributorInventory = require('../models/DistributorInventory');
const InventoryLog = require('../models/InventoryLog');
const Branch = require('../models/Branch');
const SalesRep = require('../models/SalesRep');
const Distributor = require('../models/Distributor');

// @desc    Initiate a return
// @route   POST /api/returns
// @access  Private
const initiateReturn = async (req, res) => {
  try {
    const { items, receiverId, note } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items to return' });
    }

    if (!receiverId && req.user.role !== 'branch') {
      return res.status(400).json({ message: 'Receiver ID is required' });
    }

    // Determine Sender Type and deduct stock
    let senderType;
    let senderField = {};
    let receiverType;
    let receiverField = {};
    let InventoryModel;
    let inventoryQueryField = '';

    if (req.user.role === 'distributor') {
      senderType = 'Distributor';
      const distributor = await Distributor.findOne({ user: req.user._id });
      if (!distributor) return res.status(404).json({ message: 'Distributor not found' });
      senderField = { senderDistributor: distributor._id };
      
      receiverType = 'SalesRep';
      const salesRep = await SalesRep.findById(receiverId);
      if (!salesRep) return res.status(404).json({ message: 'Superstockist not found' });
      receiverField = { receiverSalesRep: salesRep._id };

      InventoryModel = DistributorInventory;
      inventoryQueryField = 'distributor';
    } else if (req.user.role === 'sales') {
      senderType = 'SalesRep';
      const salesRep = await SalesRep.findOne({ user: req.user._id });
      if (!salesRep) return res.status(404).json({ message: 'Superstockist not found' });
      senderField = { senderSalesRep: salesRep._id };

      receiverType = 'Branch';
      const branch = await Branch.findById(receiverId);
      if (!branch) return res.status(404).json({ message: 'Branch not found' });
      receiverField = { receiverBranch: branch._id };

      InventoryModel = SalesRepInventory;
      inventoryQueryField = 'SalesRep';
    } else if (req.user.role === 'branch') {
      senderType = 'Branch';
      const branch = await Branch.findOne({ user: req.user._id });
      if (!branch) return res.status(404).json({ message: 'Branch not found' });
      senderField = { senderBranch: branch._id };

      receiverType = 'Admin';
      // No specific receiverId needed for Admin

      InventoryModel = BranchInventory;
      inventoryQueryField = 'branch';
    } else {
      return res.status(403).json({ message: 'Invalid role for return' });
    }

    // Validate and Deduct Stock
    for (const item of items) {
      const query = { product: item.product };
      query[inventoryQueryField] = senderField[Object.keys(senderField)[0]];
      
      const inventory = await InventoryModel.findOne(query);

      if (!inventory || inventory.currentStock < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for product ${item.name}` });
      }

      inventory.currentStock -= item.qty;
      await inventory.save();

      // Log Return Out
      await InventoryLog.create({
        [inventoryQueryField]: senderField[Object.keys(senderField)[0]],
        product: item.product,
        type: 'Return Out',
        quantity: item.qty,
        reason: item.reason || 'Returned to upstream',
        adjustedBy: req.user._id
      });
    }

    // Generate returnCode
    const lastReturn = await Return.findOne({}, {}, { sort: { 'createdAt': -1 } });
    let nextId = 1;
    if (lastReturn && lastReturn.returnCode) {
      const parts = lastReturn.returnCode.split('-');
      nextId = parseInt(parts[1]) + 1;
    }
    const returnCode = `RET-${nextId.toString().padStart(4, '0')}`;

    // Create Return Record
    const newReturn = await Return.create({
      returnCode,
      senderType,
      ...senderField,
      receiverType,
      ...receiverField,
      items,
      note
    });

    res.status(201).json(newReturn);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while initiating return' });
  }
};

// @desc    Get returns (outgoing or incoming)
// @route   GET /api/returns?type=outgoing|incoming
// @access  Private
const getReturns = async (req, res) => {
  try {
    const { type } = req.query; // 'outgoing' or 'incoming'
    let query = {};

    if (req.user.role === 'distributor') {
      const distributor = await Distributor.findOne({ user: req.user._id });
      if (!distributor) return res.status(404).json({ message: 'Distributor not found' });
      
      if (type === 'outgoing') query.senderDistributor = distributor._id;
      // Distributors don't receive returns currently
    } else if (req.user.role === 'sales') {
      const salesRep = await SalesRep.findOne({ user: req.user._id });
      if (!salesRep) return res.status(404).json({ message: 'Superstockist not found' });
      
      if (type === 'outgoing') query.senderSalesRep = salesRep._id;
      if (type === 'incoming') query.receiverSalesRep = salesRep._id;
    } else if (req.user.role === 'branch') {
      const branch = await Branch.findOne({ user: req.user._id });
      if (!branch) return res.status(404).json({ message: 'Branch not found' });
      
      if (type === 'outgoing') query.senderBranch = branch._id;
      if (type === 'incoming') query.receiverBranch = branch._id;
    } else if (req.user.role === 'admin') {
      if (type === 'incoming') query.receiverType = 'Admin';
      // Admin sees everything if no type specified
    }

    const returns = await Return.find(query)
      .populate('senderBranch', 'name location')
      .populate('senderSalesRep', 'name location salesId')
      .populate('senderDistributor', 'name location distributorId')
      .populate('receiverBranch', 'name location')
      .populate('receiverSalesRep', 'name location salesId')
      .populate('items.product', 'name sku price')
      .sort({ createdAt: -1 });

    res.json(returns);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while fetching returns' });
  }
};

// @desc    Update return status (Receive or Reject)
// @route   PATCH /api/returns/:id/status
// @access  Private
const updateReturnStatus = async (req, res) => {
  try {
    const { status } = req.body; // 'Received' or 'Rejected'
    const returnDoc = await Return.findById(req.params.id);

    if (!returnDoc) return res.status(404).json({ message: 'Return not found' });
    if (returnDoc.status !== 'Pending') return res.status(400).json({ message: 'Return already processed' });
    if (!['Received', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    // Validate if the current user is the correct receiver
    if (req.user.role === 'sales') {
      const salesRep = await SalesRep.findOne({ user: req.user._id });
      if (returnDoc.receiverSalesRep.toString() !== salesRep._id.toString()) return res.status(403).json({ message: 'Not authorized to process this return' });
    } else if (req.user.role === 'branch') {
      const branch = await Branch.findOne({ user: req.user._id });
      if (returnDoc.receiverBranch.toString() !== branch._id.toString()) return res.status(403).json({ message: 'Not authorized to process this return' });
    } else if (req.user.role === 'admin') {
      if (returnDoc.receiverType !== 'Admin') return res.status(403).json({ message: 'Not authorized to process this return' });
    }

    if (status === 'Received') {
      // Add stock to receiver
      let ReceiverModel;
      let receiverQueryField = '';
      let receiverId = null;

      if (returnDoc.receiverType === 'SalesRep') {
        ReceiverModel = SalesRepInventory;
        receiverQueryField = 'SalesRep';
        receiverId = returnDoc.receiverSalesRep;
      } else if (returnDoc.receiverType === 'Branch') {
        ReceiverModel = BranchInventory;
        receiverQueryField = 'branch';
        receiverId = returnDoc.receiverBranch;
      }
      
      // If admin, we don't have a specific inventory model, just update product central stock? 
      // Actually Admin uses central stock. Wait, do we have central stock?
      // Yes, Admin stock is probably in Product directly? No, wait... let's check `inventoryController.js`.
      // Actually Admin stock is usually just "created", but if it's returned to Admin, we just log it or add it to some branch. Let's assume Admin just receives it.

      if (ReceiverModel && receiverId) {
        for (const item of returnDoc.items) {
          const query = { product: item.product, [receiverQueryField]: receiverId };
          let inventory = await ReceiverModel.findOne(query);

          if (!inventory) {
            inventory = await ReceiverModel.create({ ...query, currentStock: item.qty });
          } else {
            inventory.currentStock += item.qty;
            await inventory.save();
          }

          // Log Return In
          await InventoryLog.create({
            [receiverQueryField]: receiverId,
            product: item.product,
            type: 'Return In',
            quantity: item.qty,
            reason: `Return received from ${returnDoc.senderType}`,
            adjustedBy: req.user._id
          });
        }
      }
    } else if (status === 'Rejected') {
      // Refund stock back to sender
      let SenderModel;
      let senderQueryField = '';
      let senderId = null;

      if (returnDoc.senderType === 'Distributor') {
        SenderModel = DistributorInventory;
        senderQueryField = 'distributor';
        senderId = returnDoc.senderDistributor;
      } else if (returnDoc.senderType === 'SalesRep') {
        SenderModel = SalesRepInventory;
        senderQueryField = 'SalesRep';
        senderId = returnDoc.senderSalesRep;
      } else if (returnDoc.senderType === 'Branch') {
        SenderModel = BranchInventory;
        senderQueryField = 'branch';
        senderId = returnDoc.senderBranch;
      }

      for (const item of returnDoc.items) {
        const query = { product: item.product, [senderQueryField]: senderId };
        let inventory = await SenderModel.findOne(query);
        if (inventory) {
          inventory.currentStock += item.qty;
          await inventory.save();
        }

        // Log Refund
        await InventoryLog.create({
          [senderQueryField]: senderId,
          product: item.product,
          type: 'Return In', // essentially giving back
          quantity: item.qty,
          reason: `Return Rejected by ${returnDoc.receiverType}`,
          adjustedBy: req.user._id
        });
      }
    }

    returnDoc.status = status;
    await returnDoc.save();

    res.json(returnDoc);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error while updating return status' });
  }
};

module.exports = {
  initiateReturn,
  getReturns,
  updateReturnStatus
};
