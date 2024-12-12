import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Player, usePlayer } from '../utils/PlayerContext';
import { getData } from '../utils/apiUtils';
import ChallengePopup from '../components/ChallengePopup';
import Chat from '../components/Chat';
import socket from '../utils/socket';
import './Lobby.css';


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

        socket.on('challengeRejected', () => {
            setChallengeSent(null);
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
            const gameId = `${player.socketId}-${challenger.socketId}-${Math.random().toString(36).slice(2, 9)}`;
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
        if (challenger) {
            socket.emit('rejectChallenge', challenger.socketId);
            setChallenger(null);
        }
    };

    // Create single player game
    const initGame = async () => {
        const gameId = `${player?.socketId}-${Math.random().toString(36).slice(2, 9)}`;
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
            <div className='lobby-header'>
                <div className='left'><div className='lobby-username'>Welcome, {player?.username}</div></div>
                <h1>Lobby</h1>
                <div className='right'><button className='btn-underline logout-btn' onClick={handleLogout}>Log out</button></div>
            </div>

            <div className='lobby-body'>
                <div className='player-container'>
                    <h2>Players</h2>
                    <ul className='player-list'>
                        {players.filter(p => !p.currentGameId).map((p) => (
                            <li className='player' key={p.id}>
                                {p.username}
                                {player?.id !== p.id && (
                                    challengeSent === p.id ? (
                                        <button className='challenge-btn' disabled>Challenge Sent</button>
                                    ) : (
                                        <button className='challenge-btn' onClick={() => sendChallenge(p.id)}>Challenge</button>
                                    )
                                )}
                            </li>
                        ))}
                    </ul>
                </div>
                <button className='play-btn' onClick={initGame}>Play Solo</button>
            </div>
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