import express from 'express';
import connection from '../connection.js';
import authenticateToken from '../utils/authToken.js';

const router = express.Router();

// Fetch game data
router.get('/:gameId', authenticateToken, (req, res) => {
    const { gameId } = req.params;
    const query = 'SELECT * FROM Game WHERE game_ID = ?';

    connection.query(query, [gameId], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results[0]);
    });
});

export default router;