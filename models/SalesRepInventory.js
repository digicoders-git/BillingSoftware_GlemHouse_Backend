const mongoose = require('mongoose');

const salesRepInventorySchema = new mongoose.Schema({
  salesRep: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesRep',
    required: true,
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  currentStock: {
    type: Number,
    default: 0,
    min: 0,
  },
  lastUpdated: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true,
});

// Ensure a SalesRep can only have one entry per product
salesRepInventorySchema.index({ salesRep: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('SalesRepInventory', salesRepInventorySchema);
