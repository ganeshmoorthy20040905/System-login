const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const pool = require('../db');
const { sendVerificationEmail } = require('../utils/email');
const passport = require('passport');

const router = express.Router();

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'my_super_secret_access_token_key_123';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'my_super_secret_refresh_token_key_456';

const registerSchema = Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required()
});

const generateTokens = async (user) => {
    const payload = { userId: user.id, role: user.role };
    const accessToken = jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
        [user.id, refreshToken, expiresAt]
    );

    return { accessToken, refreshToken };
};

router.post('/register', async (req, res) => {
    try {
        const { error, value } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { name, email, password } = value;

        // Check if user exists
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserResult = await pool.query(
            'INSERT INTO users (name, email, password, role, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING id, email',
            [name, email, hashedPassword, 'user', false]
        );

        const newUser = newUserResult.rows[0];

        // Create verify token (using jwt for simplicity)
        const verifyToken = jwt.sign({ email: newUser.email }, ACCESS_SECRET, { expiresIn: '1h' });
        await sendVerificationEmail(newUser.email, verifyToken);

        res.status(201).json({ message: 'Registration successful. Check your email to verify.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/verify-email', async (req, res) => {
    try {
        const { token } = req.query;
        if (!token) return res.status(400).send('No token provided');

        const decoded = jwt.verify(token, ACCESS_SECRET);
        const email = decoded.email;

        await pool.query('UPDATE users SET is_verified = true WHERE email = $1', [email]);
        res.redirect('http://localhost:5173/login?verified=true');
    } catch (err) {
        console.error(err);
        res.status(400).send('Invalid or expired token');
    }
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many login attempts, please try again later."
});

router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ message: error.details[0].message });

        const { email, password } = value;

        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) return res.status(400).json({ message: 'Invalid credentials' });

        const user = userResult.rows[0];
        if (!user.is_verified) return res.status(403).json({ message: 'Please verify your email first' });
        if (!user.password) return res.status(400).json({ message: 'Please login using Google OAuth' });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(400).json({ message: 'Invalid credentials' });

        const { accessToken, refreshToken } = await generateTokens(user);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) return res.status(401).json({ message: 'No refresh token provided' });

        const tokenResult = await pool.query('SELECT * FROM refresh_tokens WHERE token = $1', [refreshToken]);
        if (tokenResult.rows.length === 0) {
            // Possible token reuse detected
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        // Verify token
        let decoded;
        try {
            decoded = jwt.verify(refreshToken, REFRESH_SECRET);
        } catch (err) {
            await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
            return res.status(403).json({ message: 'Refresh token expired' });
        }

        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.userId]);
        const user = userResult.rows[0];

        // Rotate token
        await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateTokens(user);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refreshToken]);
            res.clearCookie('refreshToken');
        }
        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Google OAuth
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', passport.authenticate('google', { failureRedirect: '/login?error=true', session: false }), async (req, res) => {
    try {
        const user = req.user;

        const { refreshToken } = await generateTokens(user);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // Redirect to frontend to get fresh access token or just send token in hash
        res.redirect(`http://localhost:5173/auth/callback?success=true`);
    } catch (err) {
        console.error(err);
        res.redirect(`http://localhost:5173/login?error=true`);
    }
});

module.exports = router;
