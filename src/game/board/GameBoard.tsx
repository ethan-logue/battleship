import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getOccupiedCells, isValidPlacement } from './BoardLogic';
import Ship, { ShipProps } from '../../components/Ship';
import './GameBoard.css';

interface GameBoardProps {
    cellSize: number;
    numRowsCols?: number;
    ships?: ShipProps[];
    randomizeShipsCallback?: React.MutableRefObject<() => void>;
    onCellClick?: (row: string, col: number) => void;
    playerGuesses: Map<string, 'hit' | 'miss'>;
    playerReady?: boolean;
    updateShips: (ships: ShipProps[]) => void;
    classes?: string;
    gameId?: string;
}

const GameBoard = React.memo(({
    cellSize,
    numRowsCols = 10,
    ships: initialShips = [],
    randomizeShipsCallback,
    onCellClick,
    playerGuesses = new Map<string, 'hit' | 'miss'>(),
    playerReady,
    updateShips,
    classes = '',
}: GameBoardProps) => {

    const rows = numRowsCols;
    const cols = numRowsCols;
    const cSize = cellSize;
    const boardMargin = 1;
    const boardSize = cSize * (rows + 2); // Add 2 for cellSize padding on either side of the grid
    const rowLabels = useMemo(() => Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i)), [rows]); // A-J+
    const colLabels = useMemo(() => Array.from({ length: cols }, (_, i) => i), [cols]); // 0-9+

    const [ships, setShips] = useState<ShipProps[]>(initialShips);

    useEffect(() => {
        updateShips(ships);
    }, [ships, updateShips]);

    // Expose randomizeShips function to Game.tsx
    if (randomizeShipsCallback) { 
        randomizeShipsCallback.current = () => {
            const occupiedCells = new Set<string>(); // Track occupied cells
    
            const randomShips = ships.map((ship) => {
                let x, y, isVertical, valid;
    
                do {
                    x = Math.floor(Math.random() * cols) + boardMargin;
                    y = Math.floor(Math.random() * rows) + boardMargin;
                    isVertical = Math.random() < 0.5;
                    valid = isValidPlacement(
                        x,
                        y,
                        ship.length,
                        isVertical,
                        ship.name,
                        ships,
                        boardMargin,
                        rows,
                        cols,
                        occupiedCells
                    );
                } while (!valid);
    
                const newCells = getOccupiedCells(x, y, ship.length, isVertical);
                newCells.forEach((cell) => occupiedCells.add(cell));
    
                return { ...ship, x, y, isVertical };
            });
    
            setShips(randomShips);
        };
    }
    
    // Handle ship placement on the game board
    const handleShipPlacement = useCallback((name: string, x: number, y: number, isVertical: boolean) => {
        const ship = ships.find((s) => s.name === name);
        if (!ship) return false;

        if (isValidPlacement(x, y, ship.length, isVertical, name, ships, boardMargin, rows, cols)) {
            const updatedShips = ships.map((s) =>
                s.name === name ? { ...s, x, y, isVertical, placed: true } : s
            );
            setShips(updatedShips);
            return true;
        }
        return false;
    }, [ships, rows, cols, boardMargin]);

    const gridCells = useMemo(() => {
        const cells = [];
        for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
            for (let colIdx = 0; colIdx < cols; colIdx++) {
                const cellId = `${rowLabels[rowIdx]}${colIdx}`;
                const guessResult = playerGuesses.get(cellId);

                cells.push(
                    <rect
                        key={`${rowIdx}-${colIdx}`}
                        x={cSize + colIdx * cSize}
                        y={cSize + rowIdx * cSize}
                        width={cSize}
                        height={cSize}
                        id={`cell-${cellId}`}
                        className={`board-cell ${playerGuesses.has(`${cellId}`) ? guessResult : ''}`}
                        onClick={() => onCellClick && onCellClick(rowLabels[rowIdx], colIdx)}
                    />
                );
            }
        }
        return cells;
    }, [cSize, cols, onCellClick, playerGuesses, rowLabels, rows]);

    return (
        <svg viewBox={`0 0 ${boardSize} ${boardSize}`} className={`game-board ${classes}`}>
            {/* Column labels */}
            <g className='col-labels'>
                {colLabels.map((col, i) => (
                    <text key={`col-${i}`} x={(cSize - cSize / 10) + cSize / 2 + (i * cSize)} y={cSize / 2 + 10} className="board-label">
                        {col}
                    </text>
                ))}
            </g>

            {/* Row labels */}
            <g className='row-labels'>
                {rowLabels.map((row, i) => (
                    <text key={`row-${i}`} x={cSize / 2 - 5} y={(cSize + cSize / 10) + cSize / 2 + (i * cSize)} className="board-label">
                        {row}
                    </text>
                ))}
            </g>

            {/* Game grid */}
            <g className='grid-cells'>{gridCells}</g>

            {/* Ships */}
            {ships && (
                <g className='ships'>
                    {ships.map((ship) => (
                        <Ship
                            key={ship.name}
                            {...ship}
                            cellSize={cSize}
                            onPlaceShip={handleShipPlacement}
                            playerReady={playerReady}
                        />
                    ))}
                </g>
            )}
        </svg>
    );
});

export default GameBoard;
