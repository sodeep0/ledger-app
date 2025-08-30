const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,

    }, date: {
        type: Date,
        required: true,
    },
    type: {
        type: String,
        required: true,
        enum :['Purchase','Sale','Payment Out','Payment In'],
    },
    mode:{
        type: String,
        enum :['Cash','Bank','Online Payment'],},
    party:{
        type : mongoose.Schema.Types.ObjectId,
        required: true,
        // The 'refPath' tells Mongoose to look at the 'partyModel' field 
    // to know which model to link to (Supplier or Customer).
        refPath: 'partyModel', 
    },
    partyModel:{
        type:String,
        required:true,
        enum:['Supplier','Customer'],
    },description:{
        type: String,
        trim:true,
    },
    amount:{
        type:Number,
        required:true,
        min:0,
    },
    
},{
    timestamps: true,
});
const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;