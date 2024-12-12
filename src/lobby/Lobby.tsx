import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player, usePlayer } from '../utils/PlayerContext';
import { getData } from '../utils/apiUtils';
import ChallengePopup from '../components/ChallengePopup';
import Chat from '../components/Chat';
import socket from '../utils/socket';


const Lobby = () => {
    const [players, setPlayers] = useState<Player[]>([]);
    const [challengeSent, setChallengeSent] = useState<number | null>(null);
    const [challenger, setChallenger] = useState<Player | null>();
    const navigate = useNavigate();

    const { player, setPlayer } = usePlayer();

    useEffect(() => {
        // Fetch list of players from the server
        getData('/lobby')
            .then((data) => setPlayers(data))
            .catch((error) => console.error('Error fetching players:', error));

        socket.on('updateLobbyPlayers', (playerList: Player[]) => {
            console.log('Updated player list:', playerList);
            setPlayers(playerList);
        });
        
        // If a challenge is received
        socket.on('challengeReceived', (challengerSocketId: string, challenger: Player) => {
            console.log('Challenge received from:', challengerSocketId);
            setChallenger(challenger);
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
    
    const handleAcceptChallenge = async () => {
        if (challenger && player) {
            const gameId = `${player.socketId}-${challenger.socketId}`;
            try {
                await getData('/game/create', 'POST', { player1_ID: challenger.id, player2_ID: player.id, gameId });
                socket.emit('acceptChallenge', challenger.socketId, gameId);
                navigate(`/game/${gameId}`);
            } catch (error) {
                console.error('Error creating game:', error);
            }
            setChallenger(null);
        }
    };

    const handleRejectChallenge = () => {
        setChallenger(null);
    };

    // Create single player game
    const initGame = async () => {
        const gameId = `${player?.socketId}`;
        try {
            await getData('/game/create', 'POST', { player1_ID: player?.id, player2_ID: null, gameId });
            socket.emit('joinGame', gameId);
            navigate(`/game/${gameId}`);
        } catch (error) {
            console.error('Error creating game:', error);
        }
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

    return (
        <div className="lobby-container">
            <button onClick={handleLogout}>Log out</button>
            <h1>Lobby</h1>
            <ul>
                {players.filter(p => !p.currentGameId).map((p) => (
                    <li key={p.id}>
                        {p.username}
                        {player?.id !== p.id && (
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
            {challenger && (
                <ChallengePopup
                    challenger={challenger}
                    onAccept={handleAcceptChallenge}
                    onReject={handleRejectChallenge}
                />
            )}
        </div>
    );
};

export default Lobby;