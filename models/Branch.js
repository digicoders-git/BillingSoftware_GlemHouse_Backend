const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  branchId: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  manager: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
  },
  gstin: {
    type: String,
    default: 'N/A',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Pending'],
    default: 'Active',
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Branch', branchSchema);

