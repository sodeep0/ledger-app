// Script to generate mock transactions for testing
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const User = require('../models/User');

// Configure dotenv to find the .env file in the parent directory (backend/)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Helper function to create a delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateMockTransactions = async () => {
  // Use the MONGO_URI from your .env file
  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    console.error('Error: MONGO_URI is not defined in your .env file.');
    return;
  }

  try {
    // Connect to MongoDB using the environment variable
    await mongoose.connect(mongoURI);
    console.log('Successfully connected to MongoDB.');

    // --- MODIFICATION START ---
    // Define the specific user name to generate transactions for
    const targetUserName = 'Test Name';

    // Find the specific user by their name
    console.log(`Searching for user with name: "${targetUserName}"`);
    const user = await User.findOne({ name: targetUserName });

    if (!user) {
      console.log(`Error: User with name "${targetUserName}" not found. Please check the name or create the user.`);
      // We'll close the connection before exiting
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      return;
    }
    console.log(`Found user: ${user.name || user.email} (ID: ${user._id})`);
    // --- MODIFICATION END ---


    // Get customers and suppliers specifically for this user
    const customers = await Customer.find({ user: user._id });
    const suppliers = await Supplier.find({ user: user._id });

    if (customers.length === 0 || suppliers.length === 0) {
      console.log('No customers or suppliers found for this user. Please create some first.');
       // We'll close the connection before exiting
      if (mongoose.connection.readyState === 1) {
        await mongoose.connection.close();
      }
      return;
    }

    const transactionTypes = ['Sale', 'Purchase', 'Payment In', 'Payment Out'];
    const totalTransactions = 200;

    console.log(`Starting to generate ${totalTransactions} transactions for user ${user._id}...`);

    // Generate and insert transactions one by one
    for (let i = 0; i < totalTransactions; i++) {
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

      const newTransaction = new Transaction({
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
      
      // Save the transaction to the database
      await newTransaction.save();
      
      // Log progress and add a delay to avoid overloading the free-tier DB
      console.log(`Created transaction ${i + 1} of ${totalTransactions}`);
      await delay(50); // 50ms delay between each creation
    }

    console.log(`\nSuccessfully generated and inserted ${totalTransactions} mock transactions.`);
    
  } catch (error) {
    console.error('Error during script execution:', error);
  } finally {
    // Ensure the connection is closed
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('MongoDB connection closed.');
    }
  }
};

generateMockTransactions();

