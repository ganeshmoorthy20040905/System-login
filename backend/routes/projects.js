const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Manager: create project
router.post('/', requireRole('manager', 'admin'), async (req, res) => {
    try {
        const { name, description } = req.body;
        const result = await pool.query(
            'INSERT INTO projects (name, description, created_by) VALUES ($1, $2, $3) RETURNING *',
            [name, description, req.user.userId]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Any authenticated user: view projects
router.get('/', async (req, res) => {
    try {
        const projects = await pool.query(`
      SELECT p.*, u.name as creator_name 
      FROM projects p
      JOIN users u ON p.created_by = u.id
    `);
        res.json(projects.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
