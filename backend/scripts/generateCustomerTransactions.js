// Script: Generate transactions for a single customer (default 100)
// Usage examples:
//   node scripts/generateCustomerTransactions.js
//   node scripts/generateCustomerTransactions.js --customerId=<id>
//   node scripts/generateCustomerTransactions.js --customerName="Acme Corp"
//   node scripts/generateCustomerTransactions.js --customerId=<id> --count=200

require('dotenv').config();
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const User = require('../models/User');

// Connection URI
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ledger-app';

// Parse simple CLI args
const args = process.argv.slice(2);
const argMap = Object.fromEntries(args.map(a => {
  const [k, v = ''] = a.replace(/^--/, '').split('=');
  return [k, v];
}));

async function main() {
  await mongoose.connect(MONGO_URI);
  try {
    // Pick a user
    const user = await User.findOne();
    if (!user) {
      console.log('No user found. Please create a user first.');
      return;
    }

    // Locate target customer
    let customer;
    const count = Math.max(parseInt(argMap.count || '100', 10), 1);

    if (argMap.customerId) {
      // Allow direct lookup by ID regardless of user, to support admin seeding
      customer = await Customer.findById(argMap.customerId);
    } else if (argMap.customerName) {
      customer = await Customer.findOne({ name: argMap.customerName, user: user._id });
    } else {
      customer = await Customer.findOne({ user: user._id });
    }

    if (!customer) {
      console.log('No matching customer found for this user.');
      return;
    }

    // Prepare transactions over the past 30 days
    const modes = ['Cash', 'Bank', 'Online Payment'];
    const types = ['Sale', 'Payment In']; // Valid for Customer
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - 30);

    const docs = [];
    for (let i = 0; i < count; i++) {
      const date = new Date(startDate.getTime() + Math.random() * (now.getTime() - startDate.getTime()));
      const type = types[Math.floor(Math.random() * types.length)];
      const amount = Math.floor(Math.random() * 9000) + 100; // 100..9100
      const mode = modes[Math.floor(Math.random() * modes.length)];
      const description = `${type} batch seed #${i + 1}`;

      docs.push({
        user: user._id,
        date,
        type,
        party: customer._id,
        partyModel: 'Customer',
        mode,
        description,
        amount,
        createdAt: date,
        updatedAt: date,
      });
    }

    const result = await Transaction.insertMany(docs);
    console.log(`Inserted ${result.length} transactions for customer: ${customer.name} (${customer._id})`);
  } catch (err) {
    console.error('Error generating customer transactions:', err);
  } finally {
    await mongoose.connection.close();
  }
}

main();


