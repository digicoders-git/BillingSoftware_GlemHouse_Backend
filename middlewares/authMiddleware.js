const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password');

      // Check status if user is not an admin
      if (req.user && req.user.role === 'branch') {
        const Branch = require('../models/Branch');
        const branch = await Branch.findOne({ user: req.user._id });
        if (!branch || branch.status !== 'Active') {
          return res.status(401).json({ message: 'Account deactivated. Please contact admin.' });
        }
      } else if (req.user && req.user.role === 'sales') {
        const SalesRep = require('../models/SalesRep');
        const sales = await SalesRep.findOne({ user: req.user._id });
        if (!sales || sales.status !== 'Active') {
          return res.status(401).json({ message: 'Sales account deactivated. Please contact admin.' });
        }
      } else if (req.user && req.user.role === 'distributor') {
        const Distributor = require('../models/Distributor');
        const distributor = await Distributor.findOne({ user: req.user._id });
        if (!distributor || distributor.status !== 'Active') {
          return res.status(401).json({ message: 'Distributor account deactivated. Please contact admin.' });
        }
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
