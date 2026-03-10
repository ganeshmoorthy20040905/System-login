const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/me', async (req, res) => {
    try {
        const result = await pool.query('SELECT id, name, email, role, is_verified, created_at FROM users WHERE id = $1', [req.user.userId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.use(requireRole('admin'));
// Admin: view users
router.get('/', async (req, res) => {
    try {
        const users = await pool.query('SELECT id, name, email, role, is_verified, created_at FROM users');
        res.json(users.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: change roles
router.put('/:id/role', async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['admin', 'manager', 'user'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role' });
        }

        const result = await pool.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role', [role, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin: delete user
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete refresh tokens first
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]);
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
