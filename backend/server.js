import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { logoutUser } from './api/auth.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization", "Content-Type"],
    }
});

const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: "http://localhost:5173",
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
    socket.on('login', (username, userId) => {
        players.push({ socketId: socket.id, username, id: userId, currentGameId: null, });
        console.log('Player logged in:', { socketId: socket.id, username, id: userId, currentGameId: null });
        io.emit('updateLobbyPlayers', players);
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
        console.log(`Challenge sent from ${socket.id} to ${opponentId}`);
        const challenger = players.find((p) => p.id === opponentId);
        io.to(challenger.socketId).emit('challengeReceived', socket.id, players.find((p) => p.socketId === socket.id));
    });

    // Handle challenge acceptance
    socket.on('acceptChallenge', (challengerSocketId) => {
        console.log(`Challenge accepted by ${socket.id} from ${challengerSocketId}`);
        const gameId = `${socket.id}-${challengerSocketId}`;
        games[gameId] = {
            players: [socket.id, challengerSocketId],
            playerReady: { [socket.id]: false, [challengerSocketId]: false },
            playerShips: { [socket.id]: [], [challengerSocketId]: [] },
            currentTurn: socket.id,
        };

        // Update players' current game ID
        players = players.map((player) => {
            if (player.socketId === socket.id || player.socketId === challengerSocketId) {
                return { ...player, currentGameId: gameId };
            }
            return player;
        });

        io.emit('updateLobbyPlayers', players);
        io.to(socket.id).emit('challengeAccepted', gameId);
        io.to(challengerSocketId).emit('challengeAccepted', gameId);
    });

    // Handle player ready
    socket.on('playerReady', (gameId, ships) => {
        if (games[gameId]) {
            games[gameId].playerReady[socket.id] = true;
            games[gameId].playerShips[socket.id] = ships;
            io.to(gameId).emit('updateGameState', games[gameId]);

            // Check if both players are ready
            const allReady = Object.values(games[gameId].playerReady).every((ready) => ready);
            if (allReady) {
                io.to(gameId).emit('startGame', games[gameId]);
            }
        }
    });

    // Handle making a move
    socket.on('makeMove', (gameId, guess) => {
        if (games[gameId]) {
            const opponentId = games[gameId].players.find((id) => id !== socket.id);
            const { hit, sunk, ship } = isShipHit(guess, games[gameId].playerShips[opponentId], 1);

            io.to(gameId).emit('updateBoard', {
                playerGuesses: { [socket.id]: guess },
                opponentGuesses: { [opponentId]: guess },
                isPlayerTurn: opponentId,
            });

            if (sunk) {
                const allSunk = games[gameId].playerShips[opponentId].every((s) => s.isSunk);
                if (allSunk) {
                    io.to(gameId).emit('gameOver', socket.id);
                }
            }
        }
    });

    // Handle joining a game
    socket.on('joinGame', (gameId) => {
        console.log(`Player joined game: ${gameId}`);
        players = players.map((player) => {
            if (player.socketId === socket.id) {
                return { ...player, currentGameId: gameId };
            }
            return player;
        });
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
        console.log(`Player logged out: ${id}`);

        // Find the player in the players array
        const player = players.find((p) => p.id === id);

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