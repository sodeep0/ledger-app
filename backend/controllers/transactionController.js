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

const getTransactionSummaries = async (req, res) => {
  try {
    const { period } = req.query;
    
    // Build date filter based on period
    let dateFilter = {};
    if (period && period !== 'all-time') {
      const now = new Date();
      let startDate = new Date();
      
      switch (period) {
        case 'today':
          startDate.setHours(0, 0, 0, 0);
          const endOfDay = new Date(startDate);
          endOfDay.setHours(23, 59, 59, 999);
          dateFilter = { $gte: startDate, $lte: endOfDay };
          break;
        case 'this-week':
          const day = startDate.getDay();
          const diff = (day === 0 ? 6 : day - 1); // Start on Monday
          startDate.setDate(startDate.getDate() - diff);
          startDate.setHours(0, 0, 0, 0);
          const endOfWeek = new Date(startDate);
          endOfWeek.setDate(startDate.getDate() + 6);
          endOfWeek.setHours(23, 59, 59, 999);
          dateFilter = { $gte: startDate, $lte: endOfWeek };
          break;
        case 'this-year':
          startDate = new Date(now.getFullYear(), 0, 1);
          const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
          dateFilter = { $gte: startDate, $lte: endOfYear };
          break;
      }
    }

    const filter = { 
      user: req.user._id,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter })
    };

    // Get aggregated summaries
    const summaries = await Transaction.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get top customers by sales
    const topCustomers = await Transaction.aggregate([
      { 
        $match: { 
          ...filter, 
          type: 'Sale',
          partyModel: 'Customer'
        } 
      },
      {
        $group: {
          _id: '$party',
          totalSales: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'customers',
          localField: '_id',
          foreignField: '_id',
          as: 'customer'
        }
      },
      {
        $project: {
          name: { $arrayElemAt: ['$customer.name', 0] },
          totalSales: 1,
          count: 1
        }
      }
    ]);

    // Get top suppliers by purchases
    const topSuppliers = await Transaction.aggregate([
      { 
        $match: { 
          ...filter, 
          type: 'Purchase',
          partyModel: 'Supplier'
        } 
      },
      {
        $group: {
          _id: '$party',
          totalPurchases: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalPurchases: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'suppliers',
          localField: '_id',
          foreignField: '_id',
          as: 'supplier'
        }
      },
      {
        $project: {
          name: { $arrayElemAt: ['$supplier.name', 0] },
          totalPurchases: 1,
          count: 1
        }
      }
    ]);

    // Get weekly sales data for the current week
    const weekRange = getWeekRange();
    const weeklySales = await Transaction.aggregate([
      {
        $match: {
          user: req.user._id,
          type: 'Sale',
          date: { $gte: weekRange.start, $lte: weekRange.end }
        }
      },
      {
        $group: {
          _id: {
            $dayOfWeek: '$date'
          },
          totalSales: { $sum: '$amount' }
        }
      }
    ]);

    // Convert to day names and fill missing days
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const salesByDay = Array(7).fill(0);
    weeklySales.forEach(item => {
      const dayIndex = item._id === 0 ? 6 : item._id - 1; // Convert Sunday=1 to Sunday=0
      salesByDay[dayIndex] = item.totalSales;
    });

    const weeklySalesData = days.map((day, index) => ({
      day,
      sales: salesByDay[index]
    }));

    res.json({
      summaries,
      topCustomers,
      topSuppliers,
      weeklySalesData
    });

  } catch (error) {
    console.error('Error in getTransactionSummaries:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// Helper function to get current week range
const getWeekRange = () => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = today.getDay();
  const diff = (day === 0 ? 6 : day - 1); // Start on Monday
  const start = new Date(today);
  start.setDate(today.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}; 

module.exports = { createTransaction, deleteTransaction, getTransactions, updateTransaction, getTransactionSummaries };