const mongoose = require('mongoose');

const distributorInventorySchema = new mongoose.Schema({
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor',
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
}, {
  timestamps: true,
});

// Ensure a distributor only has one entry per product
distributorInventorySchema.index({ distributor: 1, product: 1 }, { unique: true });

module.exports = mongoose.model('DistributorInventory', distributorInventorySchema);
