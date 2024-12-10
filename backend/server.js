import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bodyParser from 'body-parser';
import connection from './connection.js';
import dotenv from 'dotenv';

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

    // Add player to the lobby
    players.push({ id: socket.id, username: `Player ${players.length + 1}` });
    io.emit('updateLobbyPlayers', players);

    // Handle chat messages
    socket.on('sendMessage', (message) => {
        io.emit('message', { playerId: socket.id, message });
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

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
        players = players.filter((player) => player.id !== socket.id);
        io.emit('updateLobbyPlayers', players);
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});