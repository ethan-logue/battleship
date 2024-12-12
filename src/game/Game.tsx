import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ShipProps } from '../components/Ship';
import { usePlayer } from '../utils/PlayerContext';
import { getData } from '../utils/apiUtils';
import GameBoard from './board/GameBoard';
import Chat from '../components/Chat';
import socket from '../utils/socket';
import './Game.css';

const Game = () => {
	const { gameId } = useParams<{ gameId: string }>();
	const { player } = usePlayer();
	const navigate = useNavigate();

	
	// Initial game setup
	const numRowsCols = 10;
	const [cellSize, setCellSize] = useState(calculateCellSize(window.innerWidth));
	const playerRandomizeShipsRef = useRef<() => void>(() => {});
	const opponentRandomizeShipsRef = useRef<() => void>(() => {});
	
	// Game state
	const [hasOpponent, setHasOpponent] = useState<boolean>(false);
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
		if (!hasOpponent) {
			opponentRandomizeShipsRef.current();
		} else {
			socket.on('opponentReady', (opponentShips) => {
				setOpponentShips(opponentShips);
			});
		}
	}, [hasOpponent]);

	useEffect(() => {
		socket.on('hasOpponent', (value) => {
			console.log('Opponent found:', value);
			setHasOpponent(value);
		});

		socket.on('updateGameState', (gameState) => {
            if (player) {
                const opponentId = gameState.players.find((id: number) => id !== player.id);
                setIsPlayerReady(gameState.playerReady[player.id]);
                setIsOpponentReady(gameState.playerReady[opponentId]);
                setPlayerShips(gameState[`player${player.id}_ships`]);
                setOpponentShips(gameState[`player${opponentId}_ships`]);
            }
        });

		socket.on('startGame', (gameState) => {
			if (player) {
				setGameStatus(gameState.currentTurn === player.id ? 'Game started! Your turn.' : 'Game started! Opponent\'s turn.');
				setIsPlayerTurn(gameState.currentTurn === player.id);
			}
		});

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
            socket.off('updateGameState');
            socket.off('startGame');
            socket.off('updateBoard');
            socket.off('gameOver');
        };
	}, [gameId, player]);

	const handleReadyUp = async () => {
		const newPlayerReady = !isPlayerReady;
		setIsPlayerReady(newPlayerReady);

		socket.emit('updateShips', gameId, player?.id, playerShips);

		if (hasOpponent) {
			socket.emit('playerReady', gameId, playerShips);
		} else {
			setIsOpponentReady(true); // Single-player mode auto-readies opponent
			if (!isPlayerTurn) setIsPlayerTurn(true);
			setGameStatus('Your turn!');
		}
		
		try {
			if (player) {
				const playersReady = newPlayerReady && isOpponentReady;
				const response = await getData(`/game/${gameId}/update`, 'POST', {
					playerShips: { [player.id]: playerShips },
					playerGuesses: Object.fromEntries(playerGuesses),
					opponentGuesses: Object.fromEntries(opponentGuesses),
					currentTurn: isPlayerTurn ? player.id : null,
					playersReady,
				});

				console.log('Game state response:', response);
				const { gameState } = response;

				if (!gameState?.players || !Array.isArray(gameState.players)) {
					throw new Error('Invalid game state: players array is missing.');
				}

				const opponentId = gameState.players.find((id: number) => id !== player.id);
				setIsOpponentReady(gameState.playerReady[opponentId]);
	
				if (gameState.playersReady) {
					setOpponentShips(gameState[`player${opponentId === gameState.player1_ID ? 'player1_ships' : 'player2_ships'}`]);
					setPlayerGuesses(new Map(gameState[`player${player.id === gameState.player1_ID ? 'player1_guesses' : 'player2_guesses'}`]));
					setOpponentGuesses(new Map(gameState[`player${opponentId === gameState.player1_ID ? 'player1_guesses' : 'player2_guesses'}`]));
					setIsPlayerTurn(gameState.currentTurn === player.id);
					setGameStatus('Both players are ready! Starting the game...');
				} else {
					setGameStatus('Waiting for opponent to ready up...');
				}
			}
		} catch (error) {
			console.error('Error updating game state:', error);
		}
	};

	// Handle player's click on the opponent's board
	const handleCellClick = async (row: string, col: number) => {
		const guess = `${row}${col}`;
	
		if (isPlayerTurn && !playerGuesses.has(guess)) {
			try {
				const response = await getData(`/game/${gameId}/guess`, 'POST', {
					playerId: player?.id,
					guess,
				});
	
				const { hit, sunk, ship } = response;
				const newGuesses = new Map(playerGuesses);
				newGuesses.set(guess, hit ? 'hit' : 'miss');
				setPlayerGuesses(newGuesses);
	
				if (hit && ship) {
					setOpponentShips((prevShips) =>
						prevShips.map((s) =>
							s.name === ship.name ? { ...s, hits: new Set(s.hits).add(guess), isSunk: sunk } : s
						)
					);
				}
	
				setIsPlayerTurn(false);
				setGameStatus('Opponent\'s turn...');
				socket.emit('makeMove', gameId, guess);
	
				// Handle single-player mode
				if (!hasOpponent) {
					makeRandomMove();
				}
			} catch (error) {
				console.error('Error making move:', error);
			}
		}
	};

	// Handle opponent's random move
    const makeRandomMove = () => {
		setTimeout(async () => {
			try {
				const response = await getData(`/game/${gameId}/computerMove`, 'POST', {});
				const { randomGuess, hit, sunk, ship } = response;

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
			} catch (error) {
				console.error('Error making computer move:', error);
			}
		}, 500);
    };

	const handleQuit = async () => {
        try {
            await getData('/game/quit', 'POST', { playerId: player?.id, gameId });
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
						gameId={gameId}
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
						gameId={gameId}
					/>
				</div>
			</div>
		
			<Chat socket={socket} room={gameId || ''} />
		</div>
  );
};

export default Game;
