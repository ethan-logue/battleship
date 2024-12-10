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

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);

    // Handle user login
    socket.on('login', (username, userId) => {
        players.push({ socketId: socket.id, username, id: userId });
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
        io.to(opponentId).emit('challengeReceived', socket.id);
    });

    // Handle challenge acceptance
    socket.on('acceptChallenge', (opponentId) => {
        const gameId = `${socket.id}-${opponentId}`;
        io.to(socket.id).emit('challengeAccepted', gameId);
        io.to(opponentId).emit('challengeAccepted', gameId);
    });

    // Handle quitting the game
    socket.on('quitGame', (gameId) => {
        console.log(`Player quit game: ${gameId}`);
        io.to(gameId).emit('gameOver', 'quit');
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