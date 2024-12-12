import express from 'express';
import connection from '../connection.js';

const router = express.Router();

// Route to handle storing chat messages
router.post('/', (req, res) => {
    const { senderId, gameId, message } = req.body;
    const query = 'INSERT INTO Chat (sender_ID, game_ID, message) VALUES (?, ?, ?)';
    connection.query(query, [senderId, gameId, message], (err) => {
        if (err) {
            console.error('Error storing chat message:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(200).json({ message: 'Message stored successfully' });
    });
});

export default router;