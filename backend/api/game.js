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

// Update game state
router.post('/:gameId/update', authenticateToken, (req, res) => {
    const { gameId } = req.params;
    const { playerShips, playerGuesses, opponentGuesses, currentTurn, playersReady } = req.body;

    // Fetch player IDs from the Game table
    const fetchPlayersQuery = 'SELECT player1_ID, player2_ID, player1_ships, player2_ships FROM Game WHERE game_ID = ?';
    connection.query(fetchPlayersQuery, [gameId], (fetchErr, results) => {
        if (fetchErr) {
            console.error('Database fetch error:', fetchErr);
            return res.status(500).json({ error: 'Database fetch error' });
        }

        const game = results[0];
        const player1Ships = JSON.stringify(playerShips[game.player1_ID] || JSON.parse(game.player1_ships) || null);
        const player2Ships = JSON.stringify(playerShips[game.player2_ID] || JSON.parse(game.player2_ships) || null);

        const updateQuery = `
            UPDATE Game SET 
                player1_ships = COALESCE(?, player1_ships),
                player2_ships = COALESCE(?, player2_ships),
                player1_guesses = ?,
                player2_guesses = ?,
                current_turn = ?,
                players_ready = ?
            WHERE game_ID = ?`;

        const updateValues = [
            player1Ships,
            player2Ships,
            JSON.stringify(playerGuesses),
            JSON.stringify(opponentGuesses),
            currentTurn,
            playersReady,
            gameId
        ];

        connection.query(updateQuery, updateValues, (updateErr) => {
            if (updateErr) {
                console.error('Database update error:', updateErr);
                return res.status(500).json({ error: 'Database update error' });
            }

            const players = [game.player1_ID, game.player2_ID];
            res.json({
                message: 'Game state updated',
                gameState: { playerShips, playerGuesses, opponentGuesses, currentTurn, playersReady, players },
            });
        });
    });
});

// Check if a guess hits any ship
router.post('/:gameId/guess', authenticateToken, (req, res) => {
    const { gameId } = req.params;
    const { playerId, guess } = req.body;

    // Fetch game state from the database
    const fetchGameQuery = 'SELECT player1_ID, player2_ID, player1_ships, player2_ships FROM Game WHERE game_ID = ?';
    connection.query(fetchGameQuery, [gameId], (fetchErr, results) => {
        if (fetchErr) {
            return res.status(500).json({ error: 'Database error' });
        }

        const game = results[0];
        console.log('GAME FROM GUESS', game);
        
        const opponentId = game.player1_ID === playerId ? game.player2_ID : game.player1_ID;
        const opponentShips = JSON.parse(game.player1_ID === playerId ? game.player2_ships : game.player1_ships || '[]');

        // Check if the guess hits any ship
        const hitShip = opponentShips.find((ship) =>
            getOccupiedCells(ship.x, ship.y, ship.length, ship.isVertical).includes(guess)
        );

        if (hitShip) {
            hitShip.hits.add(guess);

            // Check if the ship is sunk
            const occupiedCells = getOccupiedCells(hitShip.x, hitShip.y, hitShip.length, hitShip.isVertical);
            const sunk = occupiedCells.every((cell) => hitShip.hits.has(cell));

            // Update the opponent's ships in the database
            const updateShipsQuery = `UPDATE Game SET ${game.player1_ID === playerId ? 'player2_ships' : 'player1_ships'} = ? WHERE game_ID = ?`;
            connection.query(updateShipsQuery, [JSON.stringify(opponentShips), gameId], (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ error: 'Database error' });
                }

                res.json({ hit: true, sunk, ship: hitShip });
            });
        } else {
            res.json({ hit: false, sunk: false });
        }
    });
});

router.post('/:gameId/computerMove', authenticateToken, (req, res) => {
    const { gameId } = req.params;

    // Fetch game state from the database
    const fetchGameQuery = 'SELECT player1_ID, player2_ID, player1_ships, player2_ships, player2_guesses FROM Game WHERE game_ID = ?';
    connection.query(fetchGameQuery, [gameId], (fetchErr, results) => {
        if (fetchErr) {
            return res.status(500).json({ error: 'Database error' });
        }

        const game = results[0];
        const playerId = game.player1_ID;
        const playerShips = JSON.parse(game.player1_ships || '[]');
        const opponentGuesses = new Map(Object.entries(JSON.parse(game.player2_guesses || '{}')));

        // Generate a random valid move
        const randomGuess = randomMove(10, opponentGuesses);
        if (!randomGuess) return res.json({ error: 'No valid moves left' });

        // Check if the guess hits any ship
        const { hit, sunk, ship } = isShipHit(randomGuess, playerShips, 1);

        // Update opponent's guesses
        opponentGuesses.set(randomGuess, hit ? 'hit' : 'miss');

        // Update the player's ships if hit
        if (hit && ship) {
            ship.hits.add(randomGuess);
            const occupiedCells = getOccupiedCells(ship.x, ship.y, ship.length, ship.isVertical);
            const isSunk = occupiedCells.every((cell) => ship.hits.has(cell));
            ship.isSunk = isSunk;
        }

        // Update the game state in the database
        const updateGameQuery = 'UPDATE Game SET player1_ships = ?, player2_guesses = ? WHERE game_ID = ?';
        connection.query(updateGameQuery, [JSON.stringify(playerShips), JSON.stringify(Object.fromEntries(opponentGuesses)), gameId], (updateErr) => {
            if (updateErr) {
                return res.status(500).json({ error: 'Database error' });
            }

            res.json({ randomGuess, hit, sunk, ship });
        });
    });
});

// Create a new game
router.post('/create', authenticateToken, (req, res) => {
    const { player1_ID, player2_ID, gameId } = req.body;
    const query = 'INSERT INTO Game (game_ID, player1_ID, player2_ID, current_turn, game_status, players_ready, player1_ships, player2_ships, player1_guesses, player2_guesses) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    const values = [gameId, player1_ID, player2_ID, player1_ID, 'ongoing', false, JSON.stringify({}), JSON.stringify({}), JSON.stringify({}), JSON.stringify({})];

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