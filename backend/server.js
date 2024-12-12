import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { logoutUser } from './api/auth.js';
import { isShipHit } from './utils/logic.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.BASE_URL || "http://localhost:5173",
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization", "Content-Type"],
    }
});

const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.BASE_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization", "Content-Type"],
}));
app.use(bodyParser.json());

// Import API routes
import authRoutes from './api/auth.js';
import lobbyRoutes from './api/lobby.js';
import gameRoutes from './api/game.js';

app.use('/api/auth', authRoutes);
app.use('/api/lobby', lobbyRoutes);
app.use('/api/game', gameRoutes);

let players = [];
let games = {};

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Handle user login
    socket.on('login', (username, userId, email, token) => {
        players.push({ socketId: socket.id, username, id: userId, email, currentGameId: null, token });
        io.emit('updateLobbyPlayers', players);
        io.emit('setSocketId', userId, socket.id);
    });

    // Handle chat messages
    socket.on('sendMessage', (data) => {
        const { room, message, username } = data;
        io.to(room).emit('messageResponse', { username, message });
    });

    // Handle room joining
    socket.on('joinRoom', (room) => {
        socket.join(room);
    });

    // Handle challenges
    socket.on('sendChallenge', (opponentId) => {
        const challenger = players.find((p) => p.id === opponentId);
        console.log(`Challenge sent from ${socket.id} to ${challenger.socketId}`);
        io.to(challenger.socketId).emit('challengeReceived', socket.id, players.find((p) => p.socketId === socket.id));
    });

    // Handle challenge rejection
    socket.on('rejectChallenge', (challengerSocketId) => {
        const challenger = players.find((p) => p.socketId === challengerSocketId);
        console.log(`Challenge rejected by ${socket.id} to ${challenger.socketId}`);
        io.to(challengerSocketId).emit('challengeRejected', socket.id);
    });

    // Handle challenge acceptance
    socket.on('acceptChallenge', (challengerSocketId, gameId) => {
        const player1 = players.find((p) => p.socketId === socket.id);
        const player2 = players.find((p) => p.socketId === challengerSocketId);
        console.log(`Challenge accepted by ${player1.username} from ${player2.username}`);

        if (!player1 || !player2) {
            console.error('Player not found');
            return;
        }
    
        games[gameId] = {
            players: [player1.id, player2.id],
            playerReady: { [player1.id]: false, [player2.id]: false },
            playerShips: { [player1.id]: [], [player2.id]: [] },
            currentTurn: player1.id,
        };

        // Update players' current game ID
        players = players.map((player) => {
            if (player.socketId === socket.id || player.socketId === challengerSocketId) {
                return { ...player, currentGameId: gameId };
            }
            return player;
        });

        io.emit('hasOpponent', true);
        io.emit('updateLobbyPlayers', players);
        io.to(socket.id).emit('challengeAccepted', gameId);
        io.to(challengerSocketId).emit('challengeAccepted', gameId);
    });

    // Handle player ready
    socket.on('playerReady', (gameId, ships) => {
        console.log(`Player ready: ${socket.id}, Ships:`, ships);

        if (games[gameId]) {
            const player = players.find((p) => p.socketId === socket.id);

            games[gameId].playerShips[player.id] = ships;
            games[gameId].playerReady[player.id] = true;

            console.log(`Updated game state for ${player.username}:`, games[gameId], ships);
    
            io.to(gameId).emit('updateGameState', {
                ...games[gameId],
                playerReady: { ...games[gameId].playerReady },
                playerShips: { ...games[gameId].playerShips },
            });
    
            // Check if both players are ready
            const allReady = Object.values(games[gameId].playerReady).every((ready) => ready);
            if (allReady) {
                games[gameId].playersReady = true;
                io.to(gameId).emit('startGame', games[gameId]);
            } else {
                io.to(gameId).emit('updateGameState', games[gameId]);
            }
        }
    });

    socket.on('opponentReady', (gameId) => {
        const player = players.find((p) => p.socketId === socket.id);
    
        if (games[gameId]) {
            const opponentId = games[gameId].players.find((id) => id !== player.id);
            io.to(gameId).emit('opponentReady', games[gameId].playerShips[opponentId]);
        }
    });

    // Handle updating ships
    socket.on('updateShips', (gameId, playerId, ships) => {
        if (games[gameId]) {
            games[gameId].playerShips[playerId] = ships;
    
            io.to(gameId).emit('updateGameState', {
                ...games[gameId],
                playerShips: { ...games[gameId].playerShips },
            });
        }
    });

    socket.on('makeMove', (gameId, guess) => {
        if (games[gameId]) {
            const player = players.find((p) => p.socketId === socket.id);
            const opponentId = games[gameId].players.find((id) => id !== player.id);
    
            const opponentShips = games[gameId].playerShips[opponentId];
            const { hit, sunk, ship } = isShipHit(guess, opponentShips, 1);
    
            if (hit && ship) {
                // Mark the hit on the ship
                const updatedShips = opponentShips.map((s) =>
                    s.name === ship.name
                        ? { ...s, hits: new Set([...s.hits, guess]), isSunk: sunk }
                        : s
                );
                games[gameId].playerShips[opponentId] = updatedShips;
            }
    
            // Update guesses
            if (!games[gameId].playerGuesses) {
                games[gameId].playerGuesses = {};
            }
            if (!games[gameId].opponentGuesses) {
                games[gameId].opponentGuesses = {};
            }
            games[gameId].playerGuesses[player.id] = {
                ...games[gameId].playerGuesses[player.id],
                [guess]: hit ? 'hit' : 'miss',
            };
            games[gameId].opponentGuesses[opponentId] = {
                ...games[gameId].opponentGuesses[opponentId],
                [guess]: hit ? 'hit' : 'miss',
            };
    
            // Check if the game is over
            if (opponentShips.every((s) => s.isSunk)) {
                io.to(gameId).emit('gameOver', player.id);
                delete games[gameId]; // Clean up the game
                return;
            }
    
            // Switch turns
            games[gameId].currentTurn = opponentId;
    
            io.to(gameId).emit('updateBoard', {
                playerGuesses: games[gameId].playerGuesses[player.id],
                opponentGuesses: games[gameId].opponentGuesses[opponentId],
                isPlayerTurn: games[gameId].currentTurn === player.id,
            });
        }
    });

    // Handle joining a game (single player)
    socket.on('joinGame', (gameId) => {
        console.log(`Player joined game: ${gameId}`);
        players = players.map((player) => {
            if (player.socketId === socket.id) {
                return { ...player, currentGameId: gameId };
            }
            return player;
        });
        io.emit('hasOpponent', false);
        io.emit('updateLobbyPlayers', players);
    });

    // Handle quitting the game
    socket.on('quitGame', (gameId) => {
        console.log(`Player quit game: ${gameId}`);
        io.to(gameId).emit('gameOver', 'quit');

        // Update players' current game ID
        players = players.map((player) => {
            if (player.currentGameId == gameId && player.socketId === socket.id) {
                return { ...player, currentGameId: null };
            }
            return player;
        });

        io.emit('updateLobbyPlayers', players);
        delete games[gameId];
    });

    // Handle logout
    socket.on('logout', (id) => {
        
        // Find the player in the players array
        const player = players.find((p) => p.id === id);
        console.log(`Player logged out: ${player.username}`);

        if (player) {
            // Remove the player from the players array
            players = players.filter((p) => p.id !== id);
            io.emit('updateLobbyPlayers', players);
        }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);

        // Find the player in the players array
        const player = players.find((p) => p.socketId === socket.id);

        if (player) {
            // Call the logout helper to update the player's current lobby and game ID to null and invalidate the token on disconnection
            logoutUser(player.id, (err) => {
                if (err) {
                    console.error('Error logging out player:', err);
                }
            });

            // Remove the player from the players array
            players = players.filter((p) => p.socketId !== socket.id);
            io.emit('updateLobbyPlayers', players);
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});