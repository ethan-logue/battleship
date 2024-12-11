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

router.post('/:gameId/update', authenticateToken, (req, res) => {
    const { gameId } = req.params;
    const { opponentShips, playerShips, playerGuesses, opponentGuesses, currentTurn } = req.body;
    const query = 'UPDATE Game SET opponent_ships = ?, player_ships = ?, playerGuesses = ?, opponentGuesses = ?, current_turn = ? WHERE game_ID = ?';
    const values = [JSON.stringify(opponentShips), JSON.stringify(playerShips), JSON.stringify(playerGuesses), JSON.stringify(opponentGuesses), currentTurn, gameId];

    connection.query(query, values, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: 'Game state updated' });
    });
});

// Create a new game
router.post('/create', authenticateToken, (req, res) => {
    const { player1_ID, player2_ID, gameId } = req.body;
    const query = 'INSERT INTO Game (game_ID, player1_ID, player2_ID, current_turn, game_status) VALUES (?, ?, ?, ?, ?)';
    const values = [gameId, player1_ID, player2_ID, player1_ID, 'ongoing'];
    
    connection.query(query, values, (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        const updatePlayerQuery = 'UPDATE Player SET current_game_id = ? WHERE player_ID IN (?, ?)';
        connection.query(updatePlayerQuery, [gameId, player1_ID, player2_ID], (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ gameId });
        });
    });
});

// Quit game
router.post('/quit', authenticateToken, (req, res) => {
    const { playerId, gameId } = req.body;
    const query = 'UPDATE Player SET current_game_id = NULL WHERE player_ID = ?';
    
    connection.query(query, [playerId], (err) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        const updateGameQuery = 'UPDATE Game SET game_status = ? WHERE game_ID = ?';
        connection.query(updateGameQuery, ['finished, player quit', gameId], (err) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Player quit the game successfully' });
        });
    });
});

export default router;