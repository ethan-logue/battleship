import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import Chat from '../components/Chat';
import { getToken } from '../utils/tokenUtils';
import { Player, usePlayer } from '../utils/PlayerContext';

const socket = io('http://localhost:3000', {
    auth: {
        token: getToken(),
    },
});

const Lobby = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [challengeSent, setChallengeSent] = useState(-1);
    const navigate = useNavigate();

    const { player } = usePlayer();

    useEffect(() => {
        // Fetch list of players from the server
        fetch('http://localhost:3000/api/lobby', {
            headers: {
                'Authorization': `Bearer ${getToken()}`,
            },
        })
            .then((response) => response.json())
            .then((data) => setPlayers(data))
            .catch((error) => console.error('Error fetching players:', error));

        socket.on('updateLobbyPlayers', (playerList: Player[]) => {
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

    const handleLogout = () => {
        navigate('/login');
    };

    const initGame = () => {
        navigate('/game');
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