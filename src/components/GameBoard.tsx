import React, { useMemo } from 'react';
import './Components.css';
import Ship from './Ship';

interface GameBoardProps {
    cellSize: number;
    numRowsCols?: number;
    ships?: {
        name: string;
        length: number;
        x: number;
        y: number;
        isVertical: boolean;
        placed: boolean;
      }[];
    onPlaceShip?: (name: string, x: number, y: number, isVertical: boolean) => void;
}

const GameBoard = React.memo(({ cellSize, numRowsCols = 10, ships, onPlaceShip = () => {} }: GameBoardProps) => {
    const rows = numRowsCols;
    const cols = numRowsCols;
    const cSize = cellSize;
    const boardSize = cSize * (rows + 2); // Add 2 for cellSize padding on either side of the grid
    const rowLabels = useMemo(() => Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i)), [rows]); // A-J+
    const colLabels = useMemo(() => Array.from({ length: cols }, (_, i) => i), [cols]); // 0-9+

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
                        onPlaceShip={onPlaceShip}
                    />
                ))}
            </g>
            // </div>
        )}
        </svg>
    );
});

export default GameBoard;
