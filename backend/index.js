const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const fs = require('fs');
const passport = require('passport');
const session = require('express-session');

require('dotenv').config();
require('./passport-setup'); // init passport

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// 🔥 IMPORTANT for Render (cookies fix)
app.set("trust proxy", 1);

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Middleware
app.use(express.json());
app.use(cookieParser());

// 🔥 CORS FIX (LIVE frontend URL)
app.use(cors({
    origin: process.env.FRONTEND_URL || "https://system-login.vercel.app",
    credentials: true
}));

// 🔥 SESSION FIX (production ready)
app.use(session({
    secret: process.env.JWT_ACCESS_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,        // MUST true in production (HTTPS)
        sameSite: "None"     // IMPORTANT for cross-origin
    }
}));

app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/projects', require('./routes/projects'));
app.use('/tasks', require('./routes/tasks'));

// Init DB & Start Server
const startServer = async () => {
    try {
        const initSql = fs.readFileSync('init.sql').toString();
        await pool.query(initSql);

        const adminEmail = 'admin@gmail.com';
        const adminResult = await pool.query('SELECT * FROM users WHERE email = $1', [adminEmail]);

        if (adminResult.rows.length === 0) {
            const hashedPassword = await bcrypt.hash('Password123!', 10);
            await pool.query(
                'INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, $5)',
                ['Admin', adminEmail, hashedPassword, 'admin', true]
            );
            console.log('Default admin seeded.');
        } else {
            console.log('Admin already exists.');
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
    }
};

startServer();

// Keep alive (Render free tier)
setInterval(() => { }, 1000 * 60 * 60);