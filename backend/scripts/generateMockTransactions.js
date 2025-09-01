// Script to generate mock transactions for testing
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ledger-app');

const generateMockTransactions = async () => {
  try {
    // Get a user (assuming there's at least one user)
    const user = await User.findOne();
    if (!user) {
      console.log('No user found. Please create a user first.');
      return;
    }

    // Get customers and suppliers
    const customers = await Customer.find({ user: user._id });
    const suppliers = await Supplier.find({ user: user._id });

    if (customers.length === 0 || suppliers.length === 0) {
      console.log('No customers or suppliers found. Please create some first.');
      return;
    }

    const transactionTypes = ['Sale', 'Purchase', 'Payment In', 'Payment Out'];
    const mockTransactions = [];

    // Generate 2000 transactions
    for (let i = 0; i < 2000; i++) {
      const isCustomer = Math.random() > 0.5;
      const party = isCustomer 
        ? customers[Math.floor(Math.random() * customers.length)]
        : suppliers[Math.floor(Math.random() * suppliers.length)];
      
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const amount = Math.floor(Math.random() * 10000) + 100; // $100 to $10,100
      
      // Generate random date within the last 2 years
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);
      const endDate = new Date();
      const randomDate = new Date(startDate.getTime() + Math.random() * (endDate.getTime() - startDate.getTime()));

      mockTransactions.push({
        user: user._id,
        date: randomDate,
        type,
        party: party._id,
        partyModel: isCustomer ? 'Customer' : 'Supplier',
        mode: 'Cash',
        description: `Mock transaction ${i + 1} - ${type}`,
        amount,
        createdAt: randomDate,
        updatedAt: randomDate
      });
    }

    // Insert all transactions
    await Transaction.insertMany(mockTransactions);
    console.log(`Successfully generated ${mockTransactions.length} mock transactions`);
    
  } catch (error) {
    console.error('Error generating mock transactions:', error);
  } finally {
    mongoose.connection.close();
  }
};

generateMockTransactions();
