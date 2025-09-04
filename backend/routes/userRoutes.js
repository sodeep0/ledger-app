const express = require('express');
const router = express.Router();
const {registerUser, loginUser, getMyStatus, listUsers, updateUserApproval, verifyUser, requestPasswordReset, verifyResetCode, resetPassword} = require('../controllers/userController');
const {protect, adminOnly} = require('../middleware/authMiddleware');

// defione routes for user registration and login
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify', verifyUser);
router.post('/forgot-password', requestPasswordReset);
router.post('/forgot-password/verify', verifyResetCode);
router.post('/forgot-password/reset', resetPassword);

// private
router.get('/me/status', protect, getMyStatus);

// admin
router.get('/', protect, adminOnly, listUsers);
router.patch('/:id/approval', protect, adminOnly, updateUserApproval);

module.exports = router;