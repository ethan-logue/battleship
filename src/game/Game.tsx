// import { useState, useEffect } from 'react';
// import io from 'socket.io-client';
// import Chat from './Chat';
import { useEffect, useMemo, useRef, useState } from 'react';
import GameBoard from './GameBoard';
import './Game.css';
import { isShipHit, randomMove } from './GameLogic';

const Game = () => {
  // const [board, setBoard] = useState(createEmptyBoard());
  // const [isMyTurn, setIsMyTurn] = useState(false);
  // const [gameStatus, setGameStatus] = useState('ongoing');
  // const socket = io('http://localhost:3000');
  // const gameId = match.params.gameId;

  // useEffect(() => {
  //   // Join the game room
  //   socket.emit('joinGame', gameId);

  //   // Listen for board updates
  //   socket.on('updateBoard', (newBoard) => {
  //     setBoard(newBoard.board);
  //     setIsMyTurn(newBoard.isMyTurn);
  //   });

  //   // Listen for game status updates
  //   socket.on('gameOver', (winner) => {
  //     setGameStatus(`Game over! Winner: ${winner}`);
  //   });
  // }, []);

  // const makeMove = (x, y) => {
  //   if (isMyTurn && board[x][y] === 0) {
  //     socket.emit('makeMove', { gameId, x, y });
  //   } else {
  //     alert('Not your turn or invalid move!');
  //   }
  // };

  // ****************************************** //

  // const handleCellClick = (row: string, col: number) => {
  //   console.log(`cell-${row}${col}`);
  // };

	const hasOpponent = false; // TODO: pass in single player or multiplayer from lobby, false is single player

	// Initial game setup
	const numRowsCols = 10;
	const [cellSize, setCellSize] = useState(calculateCellSize(window.innerWidth));
	const ships = useMemo(() => {
		const defaultShipSettings = { x: -1, y: -1, isVertical: false, cellSize: cellSize, onPlaceShip: () => true, hits: new Set<string>(), isSunk: false };
		return [
			{ name: 'carrier', length: 5, ...defaultShipSettings },
			{ name: 'battleship', length: 4, ...defaultShipSettings },
			{ name: 'cruiser', length: 3, ...defaultShipSettings },
			{ name: 'submarine', length: 3, ...defaultShipSettings },
			{ name: 'destroyer', length: 2, ...defaultShipSettings },
		];
	}, [cellSize]);
	const playerRandomizeShipsRef = useRef<() => void>(() => {});
	const opponentRandomizeShipsRef = useRef<() => void>(() => {});

	// Game state
	const [gameStatus, setGameStatus] = useState('Waiting for both players to ready up...');
	const [isPlayerTurn, setIsPlayerTurn] = useState(true);
	const [isPlayerReady, setIsPlayerReady] = useState(false);
	const [isOpponentReady, setIsOpponentReady] = useState(false);
	const [playerGuesses, setPlayerGuesses] = useState(new Map<string, 'hit' | 'miss'>());
	const [opponentGuesses, setOpponentGuesses] = useState(new Map<string, 'hit' | 'miss'>());

	useEffect(() => {
		if (!isPlayerTurn && !hasOpponent) {
			const timeout = setTimeout(() => {
				const randomGuess = randomMove(numRowsCols, opponentGuesses);
				if (!randomGuess) return;
	
				const { hit, sunk, ship } = isShipHit(randomGuess, ships, 1);
	
				const newGuesses = new Map(opponentGuesses);
				newGuesses.set(randomGuess, hit ? 'hit' : 'miss');
				setOpponentGuesses(newGuesses);
	
				if (hit && ship) {
					setShips((prevShips) =>
						prevShips.map((s) =>
							s.name === ship.name ? { ...s, hits: new Set(s.hits).add(randomGuess), isSunk: sunk } : s
						)
					);
				}
	
				console.log(`Opponent guessed: ${randomGuess}, Result: ${hit ? 'hit' : 'miss'}`);
				if (sunk && ship) console.log(`Opponent sunk your ${ship.name}!`);
	
				setIsPlayerTurn(true);
				setGameStatus('Your turn!');
			}, 500);
			return () => clearTimeout(timeout);
		}
	}, [isPlayerTurn, opponentGuesses, hasOpponent, ships]);
	

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
        if (!hasOpponent) {
            setIsOpponentReady(true); // Single-player mode auto-readies opponent
			if (!isPlayerTurn) setIsPlayerTurn(true); // Player goes first in single-player mode
			setGameStatus('Your turn!');
        } else if (isPlayerReady && isOpponentReady) {
			// Both players are ready, start the game
		}
    };

	const handleCellClick = (row: string, col: number, hit: boolean) => {
		if (!isPlayerTurn) return;

		const guess = `${row}${col}`;
		if (!playerGuesses.has(guess)) {
			const newGuesses = new Map(playerGuesses);
			newGuesses.set(guess, hit ? 'hit' : 'miss');
			setPlayerGuesses(newGuesses);

			setIsPlayerTurn(false);
			setGameStatus('Opponent\'s turn...');
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
						ships={ships}
						randomizeShipsCallback={playerRandomizeShipsRef}
						playerGuesses={opponentGuesses}
						playerReady={isPlayerReady}
					/>

					{!isPlayerReady &&
						<div className='pregame-btns'>
							<button onClick={() => playerRandomizeShipsRef.current()}>Randomize Ships</button>
							<button className={`${isPlayerReady ? 'btn-ready' : 'btn-unready'}`} onClick={handleReadyUp}>{isPlayerReady ? 'Ready!' : 'Ready Up'}</button>
						</div>
					}
				</div>
				<div className={`game-board-container`}>
					<h2>Opponent's Board</h2>
					<GameBoard
						cellSize={cellSize} 
						numRowsCols={numRowsCols}
						ships={!hasOpponent ? ships : undefined}
						randomizeShipsCallback={opponentRandomizeShipsRef}
						onCellClick={handleCellClick}
						playerGuesses={playerGuesses}
						classes={`opponent-board ${!isPlayerTurn || !isPlayerReady ? 'disabled' : ''}`}
					/>
				</div>
			</div>
		
			{/* <Chat socket={socket} room={gameId} /> */}
		</div>
  );
};

export default Game;
