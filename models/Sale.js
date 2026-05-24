const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  sellerType: {
    type: String,
    enum: ['Branch', 'SalesRep', 'Distributor'],
    required: true,
    default: 'Branch'
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  SalesRep: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesRep',
  },
  distributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor',
  },
  invoiceId: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerPhone: {
    type: String,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
      name: String,
      category: String,
      qty: Number,
      price: Number,
      total: Number,
    }
  ],
  billingType: {
    type: String,
    enum: ['With GST', 'Without GST'],
    required: true,
    default: 'Without GST'
  },
  gstRate: {
    type: Number,
    default: 0,
  },
  taxableAmount: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    default: 0,
  },
  discount: {
    type: Number,
    default: 0,
  },
  totalQty: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    default: 'Cash',
  },
  notes: {
    type: String,
  },
  date: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Sale', SaleSchema);

