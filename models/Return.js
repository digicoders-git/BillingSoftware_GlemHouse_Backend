const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema({
  returnCode: {
    type: String,
    unique: true,
    required: true,
  },
  // Sender information
  senderType: {
    type: String,
    enum: ['Branch', 'SalesRep', 'Distributor'],
    required: true
  },
  senderBranch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
  },
  senderSalesRep: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalesRep',
  },
  senderDistributor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Distributor',
  },
  
  // Receiver information
  receiverType: {
    type: String,
    enum: ['Admin', 'Branch', 'SalesRep'],
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
      reason: {
        type: String,
        default: 'Damaged'
      }
    }
  ],

  status: {
    type: String,
    enum: ['Pending', 'Received', 'Rejected'],
    default: 'Pending',
  },
  
  note: {
    type: String,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Return', returnSchema);
