const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const fs = require('fs');
const passport = require('passport');

require('dotenv').config();
require('./passport-setup'); // init passport

const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
const session = require('express-session');
app.use(session({
    secret: process.env.JWT_ACCESS_SECRET || 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // Set true in production over HTTPS
}));
app.use(passport.initialize());
app.use(passport.session());

// Rate limiting moved to specific routes

// Routes
app.use('/auth', require('./routes/auth'));
app.use('/users', require('./routes/users'));
app.use('/projects', require('./routes/projects'));
app.use('/tasks', require('./routes/tasks'));

// Init DB & Start Server
const startServer = async () => {
    try {
        // Read and run init.sql
        const initSql = fs.readFileSync('init.sql').toString();
        await pool.query(initSql);

        // Create default admin if not exists
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

// Add a keep-alive interval to prevent event loop from exiting
setInterval(() => {
    // Keep alive
}, 1000 * 60 * 60);
