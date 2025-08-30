// controllers/transactionController.js
const mongoose = require('mongoose'); // <-- IMPORT MONGOOSE
const Transaction = require('../models/Transaction.js');
const Customer = require('../models/Customer.js');
const Supplier = require('../models/Supplier.js');

const createTransaction = async (req, res) => {
  const { date, type, party: partyId, partyModel, mode, description, amount } = req.body;

  const session = await mongoose.startSession(); // <-- Start session from mongoose
  try {
    session.startTransaction();

    const party = await (partyModel === 'Supplier' ? Supplier.findById(partyId) : Customer.findById(partyId)).session(session);

    if (!party || party.user.toString() !== req.user._id.toString()) {
      throw new Error(`${partyModel} not found or not authorized`);
    }

    const numAmount = Number(amount);
    if (type === 'Purchase' || type === 'Sale') {
      party.balance += numAmount;
    } else if (type === 'Payment Out' || type === 'Payment In') {
      party.balance -= numAmount;
    }

    const transaction = new Transaction({ user: req.user._id, date, type, party: partyId, mode, partyModel, description, amount });
    
    await party.save({ session });
    const createdTransaction = await transaction.save({ session });

    await session.commitTransaction();
    res.status(201).json(createdTransaction);

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: 'Error creating transaction', error: error.message });
  } finally {
    session.endSession(); // <-- Always end the session
  }
};

const deleteTransaction = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const transaction = await Transaction.findById(req.params.id).session(session);
    if (!transaction) throw new Error('Transaction not found');
    if (transaction.user.toString() !== req.user._id.toString()) throw new Error('Not authorized');

    const party = await (transaction.partyModel === 'Supplier' ? Supplier.findById(transaction.party) : Customer.findById(transaction.party)).session(session);
    
    const numAmount = Number(transaction.amount);
    if (transaction.type === 'Purchase' || transaction.type === 'Sale') {
      party.balance -= numAmount;
    } else if (transaction.type === 'Payment Out' || transaction.type === 'Payment In') {
      party.balance += numAmount;
    }
    
    await party.save({ session });
    await transaction.deleteOne({ session });

    await session.commitTransaction();
    res.json({ message: 'Transaction removed and balances restored' });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server Error', error: error.message });
  } finally {
    session.endSession();
  }
};

const getTransactions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '10', 10), 1), 100);
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = { user: req.user._id };

    // Search filter
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { description: searchRegex },
        { type: searchRegex }
      ];
    }

    // Date range filter
    if (req.query.dateRange && req.query.dateRange !== 'all') {
      const now = new Date();
      let startDate = new Date();
      
      switch (req.query.dateRange) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      filter.date = { $gte: startDate };
    }

    // Party type filter
    if (req.query.partyType && req.query.partyType !== 'all') {
      filter.partyModel = req.query.partyType;
    }

    // Specific party filter
    if (req.query.partyId && req.query.partyId !== 'all') {
      filter.party = req.query.partyId;
    }



    const [items, total] = await Promise.all([
      Transaction.find(filter)
        .populate('party', 'name balance')
        .sort({ date: -1, createdAt: -1, _id: -1 })
        .skip(skip)
        .limit(limit),
      Transaction.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    res.json({
      items,
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    });
  } catch (error) {
    console.error('Error in getTransactions:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

const updateTransaction = async (req, res) => {
  const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const { date, type, party: partyId, partyModel, mode, description, amount } = req.body;
        const transaction = await Transaction.findById(req.params.id).session(session);

        if (!transaction) throw new Error('Transaction not found');
        if (transaction.user.toString() !== req.user._id.toString()) throw new Error('Not authorized');

        // --- Find Original Documents ---
        const originalParty = await (transaction.partyModel === 'Supplier' ? Supplier.findById(transaction.party) : Customer.findById(transaction.party)).session(session);

        // --- Reverse Original Balance Changes ---
        const originalAmount = Number(transaction.amount);
        if (transaction.type === 'Purchase' || transaction.type === 'Sale') originalParty.balance -= originalAmount;
        else if (transaction.type === 'Payment Out' || transaction.type === 'Payment In') originalParty.balance += originalAmount;

        await originalParty.save({ session });

        // --- Apply New Balance Changes ---
        const updatedParty = await (partyModel === 'Supplier' ? Supplier.findById(partyId) : Customer.findById(partyId)).session(session);
        const newAmount = Number(amount);
        if (type === 'Purchase' || type === 'Sale') updatedParty.balance += newAmount;
        else if (type === 'Payment Out' || type === 'Payment In') updatedParty.balance -= newAmount;

        await updatedParty.save({ session });

        // --- Update the transaction itself ---
        transaction.date = date;
        transaction.type = type;
        transaction.party = partyId;
        transaction.partyModel = partyModel;
        transaction.mode = mode;
        transaction.description = description;
        transaction.amount = amount;

        const updatedTransaction = await transaction.save({ session });
        await session.commitTransaction();
        res.json(updatedTransaction);
    } catch (error) {
        await session.abortTransaction();
        res.status(400).json({ message: 'Error updating transaction', error: error.message });
    } finally {
        session.endSession();
    }
}; 

module.exports = { createTransaction, deleteTransaction, getTransactions , updateTransaction };