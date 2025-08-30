const Customer = require('../models/Customer');

// @desc    Create a new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req,res)=>{
    const {name , contactInfo} = req.body;
    try{
        const customer = new Customer({
            name,
            contactInfo,
            user:req.user._id
        });
        const createdSCustomer = await customer.save();
        res.status(201).json(createdSCustomer);
    }catch(error){
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Customer with this name already exists' });
        }
        res.status(400).json({message: 'Error creating customer', error: error.message});
    }
};
// @desc    Get all customers for the logged-in user
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req,res)=>{
    try{
        //find all customers for the logged-in user
        const customers = await Customer.find({user:req.user._id});
        res.json(customers);    
    }catch(error){
        res.status(500).json({message: 'Error fetching customers', error: error.message});
    }
};
// @desc    Get a single customer by ID
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req,res)=>{
    try{
        const customer = await Customer.findById(req.params.id);
        if(!customer){
            return res.status(404).json({message: 'Customer not found'});
        }
        if(customer.user.toString() !== req.user._id.toString()){
            return res.status(401).json({message: 'Not authorized'});
        }
        res.json(customer);
    }catch(error){
        res.status(500).json({message: 'Error fetching customer', error: error.message});
    }
};
// @desc    Update a customer by ID 
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req,res)=>{
    const {name, contactInfo} = req.body;
    try{
        const customer = await Customer.findById(req.params.id);
        if(!customer){
            return res.status(404).json({message: 'Customer not found'});
        }
        if(customer.user.toString() !== req.user._id.toString()){
            return res.status(401).json({message: 'Not authorized'});
        }
        customer.name = name || customer.name;
        customer.contactInfo = contactInfo || customer.contactInfo;
        const updatedCustomer = await customer.save();
        res.json(updatedCustomer);
    }catch(error){
        if (error.code === 11000) {
            return res.status(409).json({ message: 'Customer with this name already exists' });
        }
        res.status(500).json({message: 'Error updating customer', error: error.message});
    }
};
// @desc    Delete a customer by ID
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req,res)=>{
    try{
        const customer = await Customer.findById(req.params.id);
        if(!customer){
            return res.status(404).json({message: 'Customer not found'});
        }
        if(customer.user.toString() !== req.user._id.toString()){
            return res.status(401).json({message: 'Not authorized'});
        }
        await customer.deleteOne();
        res.json({message: 'Customer removed'});
    }catch(error){
        res.status(500).json({message: 'Error deleting customer', error: error.message});
    }
};
module.exports = {createCustomer, getCustomers, getCustomerById, updateCustomer, deleteCustomer};