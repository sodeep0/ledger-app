// routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const {
  createTransaction,
  getTransactions,
  deleteTransaction,
  updateTransaction
} = require('../controllers/transactionController.js');
const { protect } = require('../middleware/authMiddleware.js');

router.route('/').post(protect, createTransaction).get(protect, getTransactions);
router.route('/:id').delete(protect, deleteTransaction);
router.route('/:id').put(protect, updateTransaction);

module.exports = router;