const mongoose = require('mongoose');

const branchInventorySchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  currentStock: {
    type: Number,
    required: true,
    default: 0,
  },
  allocatedStock: {
    type: Number,
    default: 0,
  },
  reservedStock: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Compound index to ensure unique product per branch
branchInventorySchema.index({ branch: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('BranchInventory', branchInventorySchema);
