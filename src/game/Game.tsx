// import { useState, useEffect } from 'react';
// import io from 'socket.io-client';
// import Chat from './Chat';
import { useEffect, useState } from 'react';
import GameBoard from '../components/GameBoard';
import './Game.css';
import Ship from '../components/Ship';

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

  const numRowsCols = 10;
  const [cellSize, setCellSize] = useState(calculateCellSize(window.innerWidth));
  const ships = [
    { name: 'carrier', length: 5, isVertical: false, placed: false },
    { name: 'battleship', length: 4, isVertical: false, placed: false },
    { name: 'cruiser', length: 3, isVertical: false, placed: false },
    { name: 'submarine', length: 3, isVertical: false, placed: false },
    { name: 'destroyer', length: 2, isVertical: false, placed: false },
  ];

  function calculateCellSize(width: number) {
    const padding = 128;
    const boardWidth = (width - padding) / 2;
    return Math.round(boardWidth / numRowsCols);
  }

  useEffect(() => {
    const handleResize = () => {
      setCellSize(calculateCellSize(window.innerWidth));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="game-container">

      <div className='game-header'>
        <div className='pregame-btns'>
          <button>Ready Up</button>
          <button>Randomize Ships</button>
          <button>Reset Ships</button>
        </div>

        <div className='game-status'>
          <h2>Game Status</h2>
          <p id='game-status'>Waiting for player 2...</p>
        </div>
      </div>

      <div className='game-boards'>
        <div className='game-board-container'>
          <h2>Your Board</h2>
          <GameBoard
            cellSize={cellSize}
            numRowsCols={numRowsCols}
          />
        </div>
        <div className='game-board-container'>
          <h2>Opponent's Board</h2>
          <GameBoard
            cellSize={cellSize} 
            numRowsCols={numRowsCols}
          />
        </div>
      </div>

      <div className='ships-container'>
        {ships.map((ship) => (
          <div id={`ship-${ship.name}`} className={`ship ${ship.name}-container`}>
            <Ship
              key={ship.name}
              name={ship.name}
              length={ship.length}
              cellSize={cellSize}
              isVertical={ship.isVertical}
            />
          </div>
        ))}
      </div>
      
      {/* <Chat socket={socket} room={gameId} /> */}
    </div>
  );
};

export default Game;
