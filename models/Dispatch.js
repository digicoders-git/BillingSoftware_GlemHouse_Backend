const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema({
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  method: {
    type: String,
    required: true,
  },
  reference: {
    type: String,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
      },
      name: String,
      sku: String,
      qty: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
    }
  ],
  totalItems: {
    type: Number,
    required: true,
  },
  totalValue: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Dispatched', 'Received'],
    default: 'Dispatched',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Dispatch', dispatchSchema);
