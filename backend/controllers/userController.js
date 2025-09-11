const User = require('../models/User.js');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendEmail } = require('../utils/email'); // Assuming emailService.js is in a 'utils' folder
const crypto = require('crypto');
const Verification = require('../models/Verification');

// Helper function to generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc Register a new user (sends verification code)
// @route POST /api/users/register
// @access Public
const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // If a verified user already exists, block registration
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'A user with this email is already registered.' });
        }

        // Remove any previous pending verification for this email to allow retries
        await Verification.deleteOne({ email });

        // Generate verification code and hash password for temporary storage
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
        
        // Assuming Verification.hashPassword is a static method on your model that uses bcrypt
        const passwordHash = await bcrypt.hash(password, 10); // It's safer to hash here directly

        await Verification.create({ name, email, passwordHash, code: verificationCode, expiresAt });

        // Send verification code to user
        try {
            // --- FIX 2: Match the parameters expected by emailService.js ---
            await sendEmail({
                to_email: email,
                verification_code: verificationCode,
            });
        } catch (e) {
            // This is non-blocking, but you should log the error
            console.error("Failed to send verification email:", e);
        }

        return res.status(200).json({ message: 'Verification code sent to your email.' });
    } catch (error) {
        // --- FIX 4: Add specific error logging ---
        console.error('Register User Error:', error);
        return res.status(500).json({ message: 'Server error during registration.' });
    }
};

// @desc Verify user email with code and create user
// @route POST /api/users/verify
// @access Public
const verifyUser = async (req, res) => {
    const { email, code } = req.body;
    try {
        // If user already exists, short-circuit
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already verified and exists.' });
        }

        const pending = await Verification.findOne({ email });
        if (!pending) return res.status(404).json({ message: 'No verification pending for this email. Please register again.' });
        
        if (new Date() > pending.expiresAt) {
            await Verification.deleteOne({ email });
            return res.status(400).json({ message: 'Verification code has expired. Please register again.' });
        }
        
        if (pending.code !== code) {
            return res.status(400).json({ message: 'Invalid verification code.' });
        }

        // Create the final user
        const user = await User.create({
            name: pending.name,
            email: pending.email,
            password: pending.passwordHash, // Use the already hashed password
            role: 'user',
            // --- FIX 3: Set status to 'pending' for admin approval ---
            approvalStatus: 'pending',
        });

        // Clean up the verification document
        await Verification.deleteOne({ email });

        // Don't send a token yet, user must wait for approval
        return res.status(201).json({ 
            message: 'Email verification successful! Your account is now pending admin approval.'
        });

    } catch (error) {
        console.error('Verify User Error:', error);
        return res.status(500).json({ message: 'Server error during verification.' });
    }
};


// @desc Login a user
// @route POST /api/users/login
// @access Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "You don't have an account" });
        }

        const isPasswordValid = await user.matchPassword(password);

        if (isPasswordValid) {
            // --- Add check for approval status before login ---
            if (user.approvalStatus !== 'approved') {
                return res.status(403).json({ message: `Your account is currently ${user.approvalStatus}. You cannot log in.` });
            }

            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                approvalStatus: user.approvalStatus,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Your password is incorrect' });
        }
    } catch (error) {
        console.error('Login User Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc Request password reset code
// @route POST /api/users/forgot-password
// @access Public
const requestPasswordReset = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: "You don't have an account" });
        }

        const code = crypto.randomInt(100000, 999999).toString();
        user.verificationCode = code;
        user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        try {
            await sendEmail({ to_email: user.email, verification_code: code });
        } catch (e) {
            console.error('Failed to send reset email:', e);
        }

        return res.json({ message: 'Password reset code sent to your email.' });
    } catch (error) {
        console.error('Request Password Reset Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// @desc Verify reset code
// @route POST /api/users/forgot-password/verify
// @access Public
const verifyResetCode = async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "You don't have an account" });
        if (!user.verificationCode || !user.verificationCodeExpires) {
            return res.status(400).json({ message: 'No reset code found. Please request a new one.' });
        }
        if (new Date() > user.verificationCodeExpires) {
            user.verificationCode = undefined;
            user.verificationCodeExpires = undefined;
            await user.save();
            return res.status(400).json({ message: 'Reset code expired. Please request a new one.' });
        }
        if (user.verificationCode !== code) {
            return res.status(400).json({ message: 'Invalid reset code.' });
        }
        // Mark as verified for reset by clearing code but setting a short-lived flag via token-like approach
        // For simplicity, respond success; frontend will proceed to reset page with email in state.
        return res.json({ message: 'Code verified. You may reset your password now.' });
    } catch (error) {
        console.error('Verify Reset Code Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// @desc Reset password
// @route POST /api/users/forgot-password/reset
// @access Public
const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "You don't have an account" });
        if (!user.verificationCode || !user.verificationCodeExpires) {
            return res.status(400).json({ message: 'No reset code found. Please request a new one.' });
        }
        if (new Date() > user.verificationCodeExpires) {
            user.verificationCode = undefined;
            user.verificationCodeExpires = undefined;
            await user.save();
            return res.status(400).json({ message: 'Reset code expired. Please request a new one.' });
        }
        if (user.verificationCode !== code) {
            return res.status(400).json({ message: 'Invalid reset code.' });
        }

        user.password = newPassword; // pre-save will hash
        user.verificationCode = undefined;
        user.verificationCodeExpires = undefined;
        await user.save();

        return res.json({ message: 'Password reset successful. You may now log in.' });
    } catch (error) {
        console.error('Reset Password Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// @desc Get current user's profile and status
// @route GET /api/users/me/status
// @access Private
const getMyStatus = async (req, res) => {
    try {
        // req.user is populated by your auth middleware
        return res.json({
            _id: req.user._id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role,
            approvalStatus: req.user.approvalStatus,
        });
    } catch (error) {
        console.error('Get Status Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// @desc Admin list all users
// @route GET /api/users
// @access Admin
const listUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        return res.json(users);
    } catch (error) {
        console.error('List Users Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};

// @desc Admin update user approval status
// @route PATCH /api/users/:id/approval
// @access Admin
const updateUserApproval = async (req, res) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.approvalStatus = status;
        await user.save();
        
        // Notify user of the decision and report result
        let emailNotification = 'skipped';
        try {
            await sendEmail({
                to_email: user.email,
                subject: `Your account status has been updated to: ${status}`,
                message: `Hello ${user.name}, an administrator has updated your account status to: ${status}.`,
            });
            emailNotification = 'sent';
        } catch (e) {
            console.error("Failed to send approval status email:", e);
            emailNotification = 'failed';
        }

        return res.json({
            _id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
            approvalStatus: user.approvalStatus,
            emailNotification,
        });
    } catch (error) {
        console.error('Update Approval Error:', error);
        return res.status(500).json({ message: 'Server error' });
    }
};


// --- FIX 1: Combine all exports into a single object ---
module.exports = {
    registerUser,
    verifyUser,
    loginUser,
    getMyStatus,
    listUsers,
    updateUserApproval,
    requestPasswordReset,
    verifyResetCode,
    resetPassword
};
