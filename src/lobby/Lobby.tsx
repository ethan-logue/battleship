// import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import io from 'socket.io-client';
// import Chat from '../game/Chat';

const Lobby = () => {
    // const [players, setPlayers] = useState([]);
    // const [challengeSent, setChallengeSent] = useState(null);
    // const socket = io('http://localhost:3000'); 
    const navigate = useNavigate();

    // useEffect(() => {
    //     // Fetch list of players from the server
    //     socket.on('updateLobbyPlayers', (playerList) => {
    //       setPlayers(playerList);
    //     });
    
    //     // If a challenge is accepted, redirect to the game
    //     socket.on('challengeAccepted', (gameId) => {
    //       navigate(`/game/${gameId}`);
    //     });
    //   }, []);
    
    //   const sendChallenge = (opponentId: React.SetStateAction<null>) => {
    //     socket.emit('sendChallenge', opponentId);
    //     setChallengeSent(opponentId);
    //   };

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
                {/* {players.map((player) => (
                    <li key={player.id}>
                        {player.username}
                        {challengeSent === player.id ? (
                            <button disabled>Challenge Sent</button>
                        ) : (
                            <button onClick={() => sendChallenge(player.id)}>Challenge</button>
                        )}
                    </li>
                ))} */}
            </ul>
            <button onClick={initGame}>Play</button>
            {/* <Chat socket={socket} room="lobby" /> */}
        </div>
    );
};

export default Lobby;