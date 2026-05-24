const mongoose = require('mongoose');

const SalesRepInventorySchema = new mongoose.Schema({
  SalesRep: {
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
SalesRepInventorySchema.index({ SalesRep: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('SalesRepInventory', SalesRepInventorySchema);

