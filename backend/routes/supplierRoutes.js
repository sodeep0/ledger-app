const express = require('express');
const router = express.Router();
const {createSupplier,
    getSuppliers,
    getSupplierById,
    updateSupplier,
    deleteSupplier} = require('../controllers/supplierController');
const {protect} = require('../middleware/authMiddleware');

//define routes for supplier operations
router.route('/').post(protect,createSupplier)
    .get(protect,getSuppliers)
router.route('/:id')
    .get(protect,getSupplierById)
    .put(protect,updateSupplier)
    .delete(protect,deleteSupplier);
module.exports = router;