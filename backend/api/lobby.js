import express from 'express';
import connection from '../connection.js';

const router = express.Router();

// Fetch lobby data
router.get('/', (req, res) => {
    const query = 'SELECT * FROM Player WHERE current_lobby_id IS NOT NULL';

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

export default router;