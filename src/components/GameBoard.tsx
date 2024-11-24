import React, { useMemo, useState } from 'react';
import './Components.css';
import Ship, { ShipProps } from './Ship';

interface GameBoardProps {
    cellSize: number;
    numRowsCols?: number;
    ships?: ShipProps[];
    randomizeShipsCallback?: React.MutableRefObject<() => void>;
}

const GameBoard = React.memo(({ cellSize, numRowsCols = 10, ships: initialShips = [], randomizeShipsCallback }: GameBoardProps) => {
    const rows = numRowsCols;
    const cols = numRowsCols;
    const cSize = cellSize;
    const boardMargin = 1;
    const boardSize = cSize * (rows + 2); // Add 2 for cellSize padding on either side of the grid
    const rowLabels = useMemo(() => Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i)), [rows]); // A-J+
    const colLabels = useMemo(() => Array.from({ length: cols }, (_, i) => i), [cols]); // 0-9+

    const [ships, setShips] = useState<ShipProps[]>(initialShips);

    // Helper to determine occupied cells
    const getOccupiedCells = (x: number, y: number, length: number, isVertical: boolean) => {
        const cells: string[] = [];
        for (let i = 0; i < length; i++) {
            if (isVertical) cells.push(`${x},${y + i}`);
            else cells.push(`${x + i},${y}`);
        }
        return cells;
    };

    const isAdjacent = (cell: string, occupiedCells: Set<string>): boolean => {
        const [cellX, cellY] = cell.split(',').map(Number);
        const adjacentCells = [
            `${cellX - 1},${cellY}`, `${cellX + 1},${cellY}`, // Horizontal neighbors
            `${cellX},${cellY - 1}`, `${cellX},${cellY + 1}`, // Vertical neighbors
            `${cellX - 1},${cellY - 1}`, `${cellX + 1},${cellY - 1}`, // Diagonal top
            `${cellX - 1},${cellY + 1}`, `${cellX + 1},${cellY + 1}`, // Diagonal bottom
        ];
        return adjacentCells.some((adjCell) => occupiedCells.has(adjCell));
    };

    const isValidPlacement = (x: number, y: number, length: number, isVertical: boolean, currentShipName: string): boolean => {
        const newCells = getOccupiedCells(x, y, length, isVertical);
    
        // Get all occupied cells except for the current ship
        const occupiedCells = new Set(
            ships
                .filter((ship) => ship.name !== currentShipName) // Exclude the current ship
                .flatMap((ship) => getOccupiedCells(ship.x, ship.y, ship.length, ship.isVertical))
        );
    
        return newCells.every(
            (cell) => isWithinBounds(cell) && !occupiedCells.has(cell) && !isAdjacent(cell, occupiedCells) // Within grid && Not overlapping && Not adjacent
        );
    };
    
    const isWithinBounds = (cell: string) => {
        const [x, y] = cell.split(',').map(Number);
        return (
            x >= boardMargin &&
            x < cols + boardMargin &&
            y >= boardMargin &&
            y < rows + boardMargin
        );
    };
    
    const handleShipPlacement = (name: string, x: number, y: number, isVertical: boolean) => {
        const ship = ships.find((s) => s.name === name);
        if (!ship) return false;
    
        if (isValidPlacement(x, y, ship.length, isVertical, name)) {
            setShips((prevShips) =>
                prevShips.map((s) =>
                    s.name === name ? { ...s, x, y, isVertical, placed: true } : s
                )
            );
            return true;
        }
        return false;
    };

    const randomizeShips = () => {
        const occupiedCells = new Set<string>(); // Track all occupied cells during randomization
    
        const randomShips = ships.map((ship) => {
            let x, y, isVertical, valid;
    
            do {
                x = Math.floor(Math.random() * cols) + boardMargin;
                y = Math.floor(Math.random() * rows) + boardMargin;
                isVertical = Math.random() < 0.5;
    
                // Check if placement is valid given the current occupied cells
                const newCells = getOccupiedCells(x, y, ship.length, isVertical);
                valid = newCells.every(
                    (cell) => isWithinBounds(cell) && !occupiedCells.has(cell) && !isAdjacent(cell, occupiedCells)
                );
            } while (!valid);
    
            // Mark the new cells as occupied
            const newCells = getOccupiedCells(x, y, ship.length, isVertical);
            newCells.forEach((cell) => occupiedCells.add(cell));
    
            return { ...ship, x, y, isVertical };
        });
    
        setShips(randomShips);
    };

    if (randomizeShipsCallback) randomizeShipsCallback.current = randomizeShips; // Expose randomizeShips function to Game.tsx

    const gridCells = useMemo(() => {
        const cells = [];
        for (let rowIdx = 0; rowIdx < rows; rowIdx++) {
            for (let colIdx = 0; colIdx < cols; colIdx++) {
                cells.push(
                    <rect
                        key={`${rowIdx}-${colIdx}`}
                        x={cSize + colIdx * cSize}
                        y={cSize + rowIdx * cSize}
                        width={cSize}
                        height={cSize}
                        id={`cell-${rowLabels[rowIdx]}${colIdx}`}
                        className="board-cell"
                    />
                );
            }
        }
        return cells;
    }, [rows, cols, cSize, rowLabels]);

    return (
        // <>
        <svg viewBox={`0 0 ${boardSize} ${boardSize}`} className="game-board">
            {/* Column labels */}
            <g id='col-labels'>
                {colLabels.map((col, i) => (
                    <text key={`col-${i}`} x={(cSize - cSize / 10) + cSize / 2 + (i * cSize)} y={cSize / 2 + 10} className="board-label">
                        {col}
                    </text>
                ))}
            </g>

            {/* Row labels */}
            <g id='row-labels'>
                {rowLabels.map((row, i) => (
                    <text key={`row-${i}`} x={cSize / 2 - 5} y={(cSize + cSize / 10) + cSize / 2 + (i * cSize)} className="board-label">
                        {row}
                    </text>
                ))}
            </g>

            {/* Draw the grid */}
            <g id='grid-cells'>{gridCells}</g>
        {/* </svg> */}

        {/* Ships */}
        {ships && (
            <g id='ships'>
                {ships.map((ship) => (
                    <Ship
                        key={ship.name}
                        {...ship}
                        cellSize={cSize}
                        onPlaceShip={handleShipPlacement}
                    />
                ))}
            </g>
            // </div>
        )}
        </svg>
    );
});

export default GameBoard;
