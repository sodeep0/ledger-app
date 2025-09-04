const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const verificationSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
}, { timestamps: true });

verificationSchema.statics.hashPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};

const Verification = mongoose.model('Verification', verificationSchema);
module.exports = Verification;


