const SalesRep = require('../models/SalesRep');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all sales
// @route   GET /api/sales
// @access  Private/Admin
const getSalesReps = async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { salesId: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const statusFilter = req.query.status && req.query.status !== 'All' 
    ? { status: req.query.status } 
    : {};

  const count = await SalesRep.countDocuments({ ...keyword, ...statusFilter });
  const sales = await SalesRep.find({ ...keyword, ...statusFilter })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ sales, page, pages: Math.ceil(count / pageSize), total: count });
};

// @desc    Get single sales
// @route   GET /api/sales/:id
// @access  Private
const getSalesRepById = async (req, res) => {
  const sales = await SalesRep.findById(req.params.id);

  if (sales) {
    res.json(sales);
  } else {
    res.status(404).json({ message: 'sales record not found' });
  }
};

// @desc    Create a sales
// @route   POST /api/sales
// @access  Private/Admin
const createSalesRep = async (req, res) => {
  const { salesId, name, location, contact, email, password } = req.body;

  const salesRepExists = await SalesRep.findOne({ $or: [{ salesId }, { email }] });

  if (salesRepExists) {
    return res.status(400).json({ message: 'sales ID or Email already exists' });
  }

  // Create User first
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'sales',
  });

  if (user) {
    const sales = await SalesRep.create({
      salesId,
      name,
      location,
      contact,
      email,
      password: password,
      user: user._id,
    });

    res.status(201).json(sales);
  } else {
    res.status(400).json({ message: 'Invalid user data for sales' });
  }
};

// @desc    Update a sales
// @route   PUT /api/sales/:id
// @access  Private/Admin
const updateSalesRep = async (req, res) => {
  const sales = await SalesRep.findById(req.params.id);

  if (sales) {
    sales.name = req.body.name || sales.name;
    sales.location = req.body.location || sales.location;
    sales.contact = req.body.contact || sales.contact;
    sales.status = req.body.status || sales.status;
    
    if (req.body.password) {
      sales.password = req.body.password;
    }

    const updatedSalesRep = await sales.save();

    // Also update User
    const user = await User.findById(sales.user);
    if (user) {
      if (req.body.name) user.name = req.body.name;
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }
      await user.save();
    }

    res.json(updatedSalesRep);
  } else {
    res.status(404).json({ message: 'sales not found' });
  }
};

// @desc    Delete a sales
// @route   DELETE /api/sales/:id
// @access  Private/Admin
const deleteSalesRep = async (req, res) => {
  const sales = await SalesRep.findById(req.params.id);

  if (sales) {
    await User.findByIdAndDelete(sales.user);
    await SalesRep.findByIdAndDelete(req.params.id);
    res.json({ message: 'sales removed' });
  } else {
    res.status(404).json({ message: 'sales not found' });
  }
};

module.exports = {
  getSalesReps,
  getSalesRepById,
  createSalesRep,
  updateSalesRep,
  deleteSalesRep,
};

