require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
    try {
        if (!process.env.MONGO_URI) {
            console.error('MONGO_URI is required');
            process.exit(1);
        }
        if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
            console.error('ADMIN_EMAIL and ADMIN_PASSWORD are required');
            process.exit(1);
        }

        await connectDB();

        const existing = await User.findOne({ email: process.env.ADMIN_EMAIL });
        if (existing) {
            if (existing.role !== 'admin') {
                existing.role = 'admin';
                existing.approvalStatus = 'approved';
                await existing.save();
                console.log('Existing user promoted to admin and approved');
            } else {
                console.log('Admin user already exists');
            }
            process.exit(0);
        }

        const admin = new User({
            name: 'Administrator',
            email: process.env.ADMIN_EMAIL,
            password: process.env.ADMIN_PASSWORD,
            role: 'admin',
            approvalStatus: 'approved',
        });
        await admin.save();
        console.log('Admin user created');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
})();


