import express from 'express';
import connection from '../connection.js';
import authenticateToken from '../utils/authToken.js';

const router = express.Router();

// Fetch lobby data
router.get('/', authenticateToken, (req, res) => {
    const query = 'SELECT player_ID as id, username, email, current_lobby_id, current_game_id, num_wins FROM Player WHERE current_lobby_id IS NOT NULL';

    connection.query(query, (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

export default router;