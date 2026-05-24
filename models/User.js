const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
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
  phone: {
    type: String,
  },
  location: {
    type: String,
  },
  bio: {
    type: String,
  },
  role: {
    type: String,
    enum: ['admin', 'branch', 'sales', 'distributor'],
    default: 'branch',
  },
  profilePic: {
    type: String,
    default: 'https://bit.ly/dan-abramov',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', userSchema);

