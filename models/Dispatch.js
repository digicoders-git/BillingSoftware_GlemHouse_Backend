const mongoose = require('mongoose');

const dispatchSchema = new mongoose.Schema({
  // Sender information
  senderType: {
    type: String,
    enum: ['Admin', 'Branch', 'SalesRep'],
    required: true,
    default: 'Admin'
  },
  senderBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  senderSalesRep: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesRep',
  },
  
  // Receiver information
  receiverType: {
    type: String,
    enum: ['Branch', 'SalesRep', 'Distributor'],
    required: true
  },
  receiverBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  receiverSalesRep: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesRep',
  },
  receiverDistributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor',
  },

  invoiceNo: {
    type: String,
    unique: true,
    required: true,
  },
  trackingCode: {
    type: String,
    unique: true,
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
      hsn: String,
      batch: String,
      qty: {
        type: Number,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      }
    }
  ],
  billingType: {
    type: String,
    enum: ['With GST', 'Without GST', 'Transfer'],
    required: true,
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
  totalAmount: {
    type: Number,
    required: true,
  },
  totalItems: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Unpaid', 'Paid', 'Partial'],
    default: 'Unpaid',
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

