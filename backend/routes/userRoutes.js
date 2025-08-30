const express = require('express');
const router = express.Router();
const {registerUser, loginUser} = require('../controllers/userController');

// defione routes for user registration and login
router.post('/register', registerUser);
router.post('/login', loginUser);

module.exports = router;