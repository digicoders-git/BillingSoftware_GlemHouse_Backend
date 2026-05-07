const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
  },
  stock: {
    type: Number,
    required: true,
    default: 0,
  },
  category: String,
  description: String,
  image: String,
  minLevel: {
    type: Number,
    default: 5,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Product', productSchema);
