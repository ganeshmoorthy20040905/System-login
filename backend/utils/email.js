const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

const sendVerificationEmail = async (email, token) => {
    // Port 5001 because the backend is running on 5001
    const verificationLink = `http://localhost:5001/auth/verify-email?token=${token}`;

    let info = await transporter.sendMail({
        from: '"AuthForge System" <no-reply@auth-system.com>',
        to: email,
        subject: "Verify your email",
        html: `<p>Click the link below to verify your email:</p><a href="${verificationLink}">Verify Email</a>`,
    });

    console.log("Message sent: %s", info.messageId);
};

module.exports = { sendVerificationEmail };
