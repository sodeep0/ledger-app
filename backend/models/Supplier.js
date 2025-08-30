const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: true,
        trim : true,
    },
    contactInfo: {
        type: String,
        required: true,
        trim : true,
    },
    balance: {
        type: Number,
        default: 0,
        required: true,
    },
} ,{
    timestamps: true
});

// Ensure names are unique per user (not globally)
supplierSchema.index({ user: 1, name: 1 }, { unique: true });
const Supplier = mongoose.model('Supplier', supplierSchema);
module.exports = Supplier;