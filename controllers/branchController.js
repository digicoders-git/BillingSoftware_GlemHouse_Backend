const Branch = require('../models/Branch');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all Branches
// @route   GET /api/Branches
// @access  Private/Admin
const getBranches = async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;

  const keyword = req.query.keyword
    ? {
        $or: [
          { name: { $regex: req.query.keyword, $options: 'i' } },
          { branchId: { $regex: req.query.keyword, $options: 'i' } },
          { manager: { $regex: req.query.keyword, $options: 'i' } },
        ],
      }
    : {};

  const statusFilter = req.query.status && req.query.status !== 'All' 
    ? { status: req.query.status } 
    : {};

  const count = await Branch.countDocuments({ ...keyword, ...statusFilter });
  const Branches = await Branch.find({ ...keyword, ...statusFilter })
    .limit(pageSize)
    .skip(pageSize * (page - 1))
    .sort({ createdAt: -1 });

  res.json({ Branches, page, pages: Math.ceil(count / pageSize), total: count });
};

// @desc    Get single branch
// @route   GET /api/Branches/:id
// @access  Private
const getBranchById = async (req, res) => {
  const branch = await Branch.findById(req.params.id);

  if (branch) {
    res.json(branch);
  } else {
    res.status(404);
    throw new Error('Branch not found');
  }
};

// @desc    Create a branch
// @route   POST /api/Branches
// @access  Private/Admin
const createBranch = async (req, res) => {
  const { branchId, name, location, manager, contact, email, password } = req.body;

  const branchExists = await Branch.findOne({ $or: [{ branchId }, { email }] });

  if (branchExists) {
    res.status(400);
    throw new Error('Branch ID or Email already exists');
  }

  // Create User first
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await User.create({
    name: manager,
    email,
    password: hashedPassword,
    role: 'branch',
  });

  if (user) {
    const branch = await Branch.create({
      branchId,
      name,
      location,
      manager,
      contact,
      email,
      password: password, // Store plain password as requested
      user: user._id,
    });

    res.status(201).json(branch);
  } else {
    res.status(400);
    throw new Error('Invalid user data for branch');
  }
};

// @desc    Update a branch
// @route   PUT /api/Branches/:id
// @access  Private/Admin
const updateBranch = async (req, res) => {
  const branch = await Branch.findById(req.params.id);

  if (branch) {
    branch.name = req.body.name || branch.name;
    branch.location = req.body.location || branch.location;
    branch.manager = req.body.manager || branch.manager;
    branch.contact = req.body.contact || branch.contact;
    branch.status = req.body.status || branch.status;
    
    if (req.body.password) {
      branch.password = req.body.password;
    }

    const updatedBranch = await branch.save();

    // Also update User if manager name or password changed
    const user = await User.findById(branch.user);
    if (user) {
      if (req.body.manager) user.name = req.body.manager;
      if (req.body.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(req.body.password, salt);
      }
      await user.save();
    }

    res.json(updatedBranch);
  } else {
    res.status(404);
    throw new Error('Branch not found');
  }
};

// @desc    Delete a branch
// @route   DELETE /api/Branches/:id
// @access  Private/Admin
const deleteBranch = async (req, res) => {
  const branch = await Branch.findById(req.params.id);

  if (branch) {
    // Delete associated user
    await User.findByIdAndDelete(branch.user);
    await Branch.findByIdAndDelete(req.params.id);
    res.json({ message: 'Branch removed' });
  } else {
    res.status(404);
    throw new Error('Branch not found');
  }
};

// @desc    Toggle branch status
// @route   PATCH /api/Branches/:id/status
// @access  Private/Admin
const toggleBranchStatus = async (req, res) => {
  const branch = await Branch.findById(req.params.id);

  if (branch) {
    branch.status = branch.status === 'Active' ? 'Inactive' : 'Active';
    const updatedBranch = await branch.save();
    res.json(updatedBranch);
  } else {
    res.status(404);
    throw new Error('Branch not found');
  }
};

module.exports = {
  getBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  toggleBranchStatus,
};

