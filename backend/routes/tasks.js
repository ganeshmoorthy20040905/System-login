const express = require('express');
const pool = require('../db');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

// Manager: create task
router.post('/', requireRole('manager', 'admin'), async (req, res) => {
    try {
        const { title, assigned_to, project_id, deadline } = req.body;
        const result = await pool.query(
            'INSERT INTO tasks (title, assigned_to, project_id, deadline) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, assigned_to, project_id, deadline]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// User: view assigned tasks
router.get('/', async (req, res) => {
    try {
        let query;
        let params;

        if (req.user.role === 'admin' || req.user.role === 'manager') {
            // managers and admins see all
            query = `SELECT t.*, u.name as assigned_name, p.name as project_name
               FROM tasks t
               LEFT JOIN users u ON t.assigned_to = u.id
               LEFT JOIN projects p ON t.project_id = p.id`;
            params = [];
        } else {
            query = `SELECT t.*, p.name as project_name
               FROM tasks t
               LEFT JOIN projects p ON t.project_id = p.id
               WHERE t.assigned_to = $1`;
            params = [req.user.userId];
        }
        const tasks = await pool.query(query, params);
        res.json(tasks.rows);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// User/Manager: update task status
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const taskResult = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
        if (taskResult.rows.length === 0) return res.status(404).json({ message: 'Task not found' });

        // Check ownership if user
        if (req.user.role === 'user' && taskResult.rows[0].assigned_to !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized to update this task' });
        }

        const result = await pool.query(
            'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
            [status, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
