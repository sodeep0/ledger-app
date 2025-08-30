const Supplier = require('../models/Supplier');
// @desc   Create a new supplier
// @route  POST /api/suppliers
// @access Private
const createSupplier = async(req, res) => {
    const {name, contactInfo} = req.body;
    try{
        const supplier = new Supplier({
            name,
            contactInfo,
            user:req.user._id

        });
        const createdSupplier = await supplier.save();
        res.status(201).json(createdSupplier);
    }catch(error){
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Supplier with this name already exists' });
        }
        res.status(400).json({message: 'Error creating supplier' , error: error.message});
    }
};

// @desc   Get all suppliers for the logged-in user
// @route  GET /api/suppliers
// @access Private
const getSuppliers = async(req,res)=>{
    try{
        //find all suppliers for the logged-in user
        const suppliers = await Supplier.find({user:req.user._id});
        res.json(suppliers);
    }catch(error){
        res.status(500).json({message: 'Error fetching suppliers', error: error.message});
    }
}; 

// @desc   Get a single supplier by ID
// @route  GET /api/suppliers/:id
// @access Private

const getSupplierById = async (req,res)=>{
    try{
        const supplier = await Supplier.findById(req.params.id);
        if(!supplier){
            return res.status(404).json({message:"Supplier not found"});
        }
        if(supplier.user.toString()!== req.user._id.toString()){
            return res.status(401).json({message:"Not authorized"});

        }
        res.json(supplier);
    }catch(error){
        res.status(500).json({message: 'Error fetching supplier', error: error.message});
    }

};

// @desc   Update a supplier by ID
// @route  PUT /api/suppliers/:id   
// @access Private
const updateSupplier = async (req,res)=>{
    const {name, contactInfo} = req.body;
    try{
        const supplier = await Supplier.findById(req.params.id);
        if(!supplier){
            return res.status(404).json({message:"Supplier not found"});
        }
        if(supplier.user.toString()!== req.user._id.toString()){
            return res.status(401).json({message:"Not authorized"});

        }
        supplier.name = name || supplier.name;
        supplier.contactInfo = contactInfo || supplier.contactInfo;

        const updatedSupplier = await supplier.save();
        res.json(updatedSupplier);
    }catch(error){
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Supplier with this name already exists' });
        }
        res.status(500).json({message: 'Error updating supplier', error: error.message});
    }
};

// @desc   Delete a supplier by ID
// @route  DELETE /api/suppliers/:id
// @access Private
const deleteSupplier = async (req,res)=>{
    try{
        const supplier = await Supplier.findById(req.params.id);
        if(!supplier){
            return res.status(404).json({message:"Supplier not found"});
        }
        if(supplier.user.toString()!== req.user._id.toString()){
            return res.status(401).json({message:"Not authorized"});

        }
        await supplier.deleteOne();
        res.json({message: 'Supplier removed'});   

    }catch(error){
        res.status(500).json({message: 'Error deleting supplier', error: error.message});
    }
};
module.exports = {createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier};