const Distributor = require('../models/Distributor');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all distributors
// @route   GET /api/distributors
// @access  Private/Admin
const getDistributors = async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { distributorId: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const statusFilter = req.query.status && req.query.status !== 'All' 
    ? { status: req.query.status } 
    : {};

  const count = await Distributor.countDocuments({ ...keyword, ...statusFilter });
  const distributors = await Distributor.find({ ...keyword, ...statusFilter })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ distributors, page, pages: Math.ceil(count / pageSize), total: count });
};

// @desc    Get single distributor
// @route   GET /api/distributors/:id
// @access  Private
const getDistributorById = async (req, res) => {
  const distributor = await Distributor.findById(req.params.id);

  if (distributor) {
    res.json(distributor);
  } else {
    res.status(404).json({ message: 'Distributor not found' });
  }
};

// @desc    Create a distributor
// @route   POST /api/distributors
// @access  Private/Admin
const createDistributor = async (req, res) => {
  const { name, location, contact, email, password, agreementUrl, employeeName, employeeContact } = req.body;

  // Generate unique distributorId (e.g., DST-2024-001)
  const lastDistributor = await Distributor.findOne({}, {}, { sort: { 'createdAt': -1 } });
  let nextIdNumber = 1;
  const currentYear = new Date().getFullYear();
  if (lastDistributor && lastDistributor.distributorId && lastDistributor.distributorId.includes(`DST-${currentYear}-`)) {
    const parts = lastDistributor.distributorId.split('-');
    if (parts.length === 3) {
      const lastIdNumber = parseInt(parts[2], 10);
      if (!isNaN(lastIdNumber)) {
        nextIdNumber = lastIdNumber + 1;
      }
    }
  }
  const distributorId = `DST-${currentYear}-${nextIdNumber.toString().padStart(3, '0')}`;

  // Generate unique employeeId (e.g., EMP-D-001)
  let nextEmpIdNumber = 1;
  if (lastDistributor && lastDistributor.employeeId && lastDistributor.employeeId.startsWith('EMP-D-')) {
    const lastEmpIdString = lastDistributor.employeeId.split('-')[2];
    const lastEmpIdNum = parseInt(lastEmpIdString, 10);
    if (!isNaN(lastEmpIdNum)) {
      nextEmpIdNumber = lastEmpIdNum + 1;
    }
  }
  const employeeId = `EMP-D-${nextEmpIdNumber.toString().padStart(3, '0')}`;

  const distributorExists = await Distributor.findOne({ email });

  if (distributorExists) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  // Create User first
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: 'distributor',
  });

  if (user) {
    const distributor = await Distributor.create({
      distributorId,
      name,
      location,
      contact,
      employeeName,
      employeeId,
      employeeContact,
      email,
      password: password,
      user: user._id,
      agreementUrl,
    });

    res.status(201).json(distributor);
  } else {
    res.status(400).json({ message: 'Invalid user data for distributor' });
  }
};

// @desc    Update a distributor
// @route   PUT /api/distributors/:id
// @access  Private/Admin
const updateDistributor = async (req, res) => {
  const distributor = await Distributor.findById(req.params.id);

  if (distributor) {
    distributor.name = req.body.name || distributor.name;
    distributor.location = req.body.location || distributor.location;
    distributor.contact = req.body.contact || distributor.contact;
    distributor.employeeName = req.body.employeeName || distributor.employeeName;
    distributor.employeeContact = req.body.employeeContact || distributor.employeeContact;
    distributor.status = req.body.status || distributor.status;
    
    if (req.body.password) {
      distributor.password = req.body.password;
    }

    const updatedDistributor = await distributor.save();

    // Also update User
    const user = await User.findById(distributor.user);
    if (user) {
      if (req.body.name) user.name = req.body.name;
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }
      await user.save();
    }

    res.json(updatedDistributor);
  } else {
    res.status(404).json({ message: 'Distributor not found' });
  }
};

// @desc    Delete a distributor
// @route   DELETE /api/distributors/:id
// @access  Private/Admin
const deleteDistributor = async (req, res) => {
  const distributor = await Distributor.findById(req.params.id);

  if (distributor) {
    await User.findByIdAndDelete(distributor.user);
    await Distributor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Distributor removed' });
  } else {
    res.status(404).json({ message: 'Distributor not found' });
  }
};

module.exports = {
  getDistributors,
  getDistributorById,
  createDistributor,
  updateDistributor,
  deleteDistributor,
};

