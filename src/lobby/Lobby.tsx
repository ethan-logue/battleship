import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Chat from '../components/Chat';
import { Player, usePlayer } from '../utils/PlayerContext';
import { baseUrl, getData } from '../utils/apiUtils';
import { io } from 'socket.io-client';
import { getToken } from '../utils/tokenUtils';

const socket = io(baseUrl, {
    auth: {
        token: getToken(),
    },
});

const Lobby = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [challengeSent, setChallengeSent] = useState<number | null>(null);
    const navigate = useNavigate();

    const { player, setPlayer } = usePlayer();

    useEffect(() => {
        // Fetch list of players from the server
        getData('/lobby')
            .then((data) => setPlayers(data))
            .catch((error) => console.error('Error fetching players:', error));

        socket.on('updateLobbyPlayers', (playerList: Player[]) => {
            console.log('Received updated player list:', playerList);
            
            setPlayers(playerList);
        });

        // If a challenge is received
        socket.on('challengeReceived', (challengerId: number) => {
            if (window.confirm('You have been challenged! Do you accept?')) {
                socket.emit('acceptChallenge', challengerId);
            }
        });

        // If a challenge is accepted, redirect to the game
        socket.on('challengeAccepted', (gameId: string) => {
            navigate(`/game/${gameId}`);
        });

        return () => {
            socket.off('updateLobbyPlayers');
            socket.off('challengeReceived');
            socket.off('challengeAccepted');
        };
    }, [navigate]);

    const sendChallenge = (opponentId: number) => {
        socket.emit('sendChallenge', opponentId);
        setChallengeSent(opponentId);
    };

    const handleLogout = async () => {
        try {
            await getData('/auth/logout', 'POST');
            socket.emit('logout', player?.id);
            localStorage.removeItem('token');
            setPlayer(null);
            navigate('/login');
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    // Create single player game
    const initGame = async () => {
        try {
            const data = await getData('/game/create', 'POST', { player1_ID: player?.id, player2_ID: null });
            navigate(`/game/${data.gameId}`);
        } catch (error) {
            console.error('Error creating game:', error);
        }
    };

    return (
        <div className="lobby-container">
            <button onClick={handleLogout}>Log out</button>
            <h1>Lobby</h1>
            <ul>
                {players.map((p) => (
                    <li key={p.id}>
                        {p.username}
                        {player && p.id !== player.id && (
                            challengeSent === p.id ? (
                                <button disabled>Challenge Sent</button>
                            ) : (
                                <button onClick={() => sendChallenge(p.id)}>Challenge</button>
                            )
                        )}
                    </li>
                ))}
            </ul>
            <button onClick={initGame}>Play</button>
            <Chat socket={socket} room="lobby" />
        </div>
    );
};

export default Lobby;