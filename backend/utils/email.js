const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a reusable transporter object using the default SMTP transport for Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER, // Your Gmail address from .env file
        pass: process.env.EMAIL_PASS, // Your App Password from .env file
    },
});

// A flexible sendEmail function
const sendEmail = async ({ to_email, subject, message, verification_code }) => {
    
    // Determine the email body. If there's a verification code, prioritize a standard message.
    const htmlBody = verification_code 
        ? `<p>Your verification code is <strong>${verification_code}</strong>. It expires in 15 minutes.</p>`
        : `<p>${message}</p>`;
    
    // Determine the subject line
    const emailSubject = verification_code 
        ? 'Your Verification Code' 
        : subject;

    const mailOptions = {
        from: `"Ledger App" <${process.env.EMAIL_USER}>`, // sender address
        to: to_email, // list of receivers
        subject: emailSubject, // Subject line
        html: htmlBody, // html body
    };

    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('Email service is not configured. Skipping email send.');
            return;
        }
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendEmail };