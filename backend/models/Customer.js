// models/Customer.js
const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  contactInfo: {
    type: String,
    required: true,
    trim: true,
  },
  balance: {
    type: Number,
    default: 0,
    required: true,
  },
}, {
  timestamps: true,
});

// Ensure names are unique per user (not globally)
customerSchema.index({ user: 1, name: 1 }, { unique: true });

const Customer = mongoose.model('Customer', customerSchema);
module.exports = Customer;