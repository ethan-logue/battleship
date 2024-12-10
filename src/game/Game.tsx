import io from 'socket.io-client';
import Chat from '../components/Chat';
import { useEffect, useRef, useState } from 'react';
import GameBoard from './board/GameBoard';
import './Game.css';
import { isShipHit, randomMove } from './GameLogic';
import { ShipProps } from '../components/Ship';
import { useNavigate, useParams } from 'react-router-dom';
import { baseUrl, getData } from '../utils/apiUtils';
import { getToken } from '../utils/tokenUtils';
import { usePlayer } from '../utils/PlayerContext';

const socket = io(baseUrl, {
    auth: {
        token: getToken(),
    },
});

const Game = () => {

	const { gameId } = useParams<{ gameId: string }>();
	const { player } = usePlayer();
	const navigate = useNavigate();

	const hasOpponent = false; // TODO: pass in single player or multiplayer from lobby, false is single player

	// Initial game setup
	const numRowsCols = 10;
	const [cellSize, setCellSize] = useState(calculateCellSize(window.innerWidth));
	const playerRandomizeShipsRef = useRef<() => void>(() => {});
	const opponentRandomizeShipsRef = useRef<() => void>(() => {});

	// Game state
	const [gameStatus, setGameStatus] = useState('Waiting for both players to ready up...');
	const [isPlayerTurn, setIsPlayerTurn] = useState(true);
	const [isPlayerReady, setIsPlayerReady] = useState(false);
	const [isOpponentReady, setIsOpponentReady] = useState(false);
	const [playerGuesses, setPlayerGuesses] = useState(new Map<string, 'hit' | 'miss'>());
	const [opponentGuesses, setOpponentGuesses] = useState(new Map<string, 'hit' | 'miss'>());
	const [playerShips, setPlayerShips] = useState<ShipProps[]>(() => initializeShips(cellSize));
    const [opponentShips, setOpponentShips] = useState<ShipProps[]>(() => initializeShips(cellSize));

	function initializeShips(cellSize: number) {
		const defaultShipSettings = { x: -1, y: -1, isVertical: false, cellSize, onPlaceShip: () => true, hits: new Set<string>(), isSunk: false };
		return [
			{ name: 'carrier', length: 5, ...defaultShipSettings },
			{ name: 'battleship', length: 4, ...defaultShipSettings },
			{ name: 'cruiser', length: 3, ...defaultShipSettings },
			{ name: 'submarine', length: 3, ...defaultShipSettings },
			{ name: 'destroyer', length: 2, ...defaultShipSettings },
		];
	}

	useEffect(() => {
        socket.emit('joinGame', gameId);

        socket.on('updateBoard', (newBoard) => {
            setPlayerGuesses(new Map(newBoard.playerGuesses));
            setOpponentGuesses(new Map(newBoard.opponentGuesses));
            setIsPlayerTurn(newBoard.isPlayerTurn);
        });

        socket.on('gameOver', (winner) => {
			if (winner === 'quit') {
				setGameStatus('Game over! Opponent has quit the game.');
			} else {
            	setGameStatus(`Game over! Winner: ${winner}`);
			}
        });

        return () => {
            socket.off('updateBoard');
            socket.off('gameOver');
        };
    }, [gameId]);

	// Calculate cell size based on window width
	function calculateCellSize(width: number) {
		const padding = 128;
		const boardWidth = (width - padding) / 2;
		return Math.round(boardWidth / numRowsCols);
	};

	// Resize event listener to adjust cell size
	useEffect(() => {
		const handleResize = () => {
			setCellSize(calculateCellSize(window.innerWidth));
		};

		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Randomize ships on initial render
	useEffect(() => {
		playerRandomizeShipsRef.current();
		opponentRandomizeShipsRef.current();
	}, []);

	const handleReadyUp = () => {
        setIsPlayerReady(!isPlayerReady);
		socket.emit('playerReady', gameId);

        if (!hasOpponent) {
            setIsOpponentReady(true); // Single-player mode auto-readies opponent
			if (!isPlayerTurn) setIsPlayerTurn(true); // Player goes first in single-player mode
			setGameStatus('Your turn!');
        } else if (isPlayerReady && isOpponentReady) {
			// Both players are ready, start the game
		}
    };

	// Handle player's click on the opponent's board
	const handleCellClick = (row: string, col: number, hit: boolean) => {
		const guess = `${row}${col}`;

		if (isPlayerTurn && !playerGuesses.has(guess)) {
			const newGuesses = new Map(playerGuesses);
			newGuesses.set(guess, hit ? 'hit' : 'miss');
			setPlayerGuesses(newGuesses);

			setIsPlayerTurn(false);
			setGameStatus('Opponent\'s turn...');
			socket.emit('makeMove', { gameId, guess, hit });
		}
    };

	// Handle opponent's random move
    useEffect(() => {
        if (!isPlayerTurn && !hasOpponent) {
            const timeout = setTimeout(() => {
                const randomGuess = randomMove(numRowsCols, opponentGuesses);
                if (!randomGuess) return;

                const { hit, sunk, ship } = isShipHit(randomGuess, playerShips, 1);

                // Update opponent's guesses
                const newGuesses = new Map(opponentGuesses);
                newGuesses.set(randomGuess, hit ? 'hit' : 'miss');
                setOpponentGuesses(newGuesses);

                console.log('Opponent guessed:', randomGuess, hit ? 'hit' : 'miss');

                // Update player's ships if hit
                if (hit && ship) {
                    setPlayerShips((prevShips) =>
                        prevShips.map((s) =>
                            s.name === ship.name ? { ...s, hits: new Set(s.hits).add(randomGuess), isSunk: sunk } : s
                        )
                    );
                }

                setIsPlayerTurn(true);
                setGameStatus('Your turn!');
            }, 500);

            return () => clearTimeout(timeout);
        }
    }, [hasOpponent, isPlayerTurn, opponentGuesses, playerShips]);

	const handleQuit = async () => {
        try {
            await getData('/game/quit', 'POST', { playerId: player?.id });
            socket.emit('quitGame', gameId);
            navigate('/lobby');
        } catch (error) {
            console.error('Error quitting game:', error);
        }
    };

  	return (
		<div className="game-container">

			<div className='game-header'>
				<div className='game-status'>
					<h2>Game Status</h2>
					<p id='game-status'>{gameStatus}</p>
				</div>
			</div>

			<div className='game-boards'>
				<div className='game-board-container'>
					<h2>Your Board</h2>
					<GameBoard
						cellSize={cellSize}
						numRowsCols={numRowsCols}
						ships={playerShips}
						randomizeShipsCallback={playerRandomizeShipsRef}
						playerGuesses={opponentGuesses}
						playerReady={isPlayerReady}
						updateShips={setPlayerShips}
					/>

					
					<div className='game-btns'>
						<button onClick={handleQuit}>Quit Game</button>
						{!isPlayerReady &&
						<>
							<button onClick={() => playerRandomizeShipsRef.current()}>Randomize Ships</button>
							<button className={`${isPlayerReady ? 'btn-ready' : 'btn-unready'}`} onClick={handleReadyUp}>{isPlayerReady ? 'Ready!' : 'Ready Up'}</button>
						</>
						}
					</div>
				</div>
				<div className={`game-board-container`}>
					<h2>Opponent's Board</h2>
					<GameBoard
						cellSize={cellSize} 
						numRowsCols={numRowsCols}
						ships={opponentShips}
						randomizeShipsCallback={opponentRandomizeShipsRef}
						playerGuesses={playerGuesses}
						updateShips={setOpponentShips}
						onCellClick={handleCellClick}
						classes={`opponent-board ${!isPlayerTurn || !isPlayerReady ? 'disabled' : ''}`}
					/>
				</div>
			</div>
		
			<Chat socket={socket} room={gameId || ''} />
		</div>
  );
};

export default Game;
