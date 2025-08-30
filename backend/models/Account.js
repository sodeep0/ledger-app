const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        ref: 'User',
    },
    type: {
        type: String,
        enum: ['Cash','Bank','Online Payment','Other'],
        required: true
    },
    balance: {
        type: Number,
        default: 0,
        required: true,
    },
},{    timestamps: true,

});
const Account = mongoose.model('Account', AccountSchema);
module.exports = Account