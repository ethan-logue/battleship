import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import connection from '../connection.js';

const router = express.Router();

// Login route
router.post('/login', (req, res) => {
    const { email, password } = req.body;
    const query = 'SELECT * FROM Player WHERE email = ?';

    connection.query(query, [email], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = results[0];
        bcrypt.compare(password, user.password_hash, (err, isMatch) => {
            if (err) {
                return res.status(500).json({ error: 'Error comparing passwords' });
            }
            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid email or password' });
            }

            const token = jwt.sign({ id: user.player_ID }, process.env.JWT_SECRET, { expiresIn: '1h' });
            
            const updateQuery = 'UPDATE Player SET current_lobby_id = ? WHERE player_ID = ?';
            connection.query(updateQuery, [1, user.player_ID], (updateErr) => {
                if (updateErr) {
                    return res.status(500).json({ error: 'Database error' });
                }
                res.json({ token, user: { id: user.player_ID, username: user.username, email: user.email } });
            });
        });
    });
});

// Register route
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const query = 'INSERT INTO Player (username, email, password_hash) VALUES (?, ?, ?)';

    connection.query(query, [username, email, hashedPassword], (err, results) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'User registered successfully' });
    });
});

// Logout route
router.post('/logout', (req, res) => {
    // Invalidate the token (implementation depends on your token management strategy)
    res.json({ message: 'Logout successful' });
});

export default router;