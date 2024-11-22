import React, { useMemo } from 'react';
import './Components.css';

interface GameBoardProps {
    cellSize: number;
    numRowsCols?: number;
    onCellClick?: (row: string, col: number) => void;
}

const GameBoard = React.memo(({ cellSize, numRowsCols = 10, onCellClick }: GameBoardProps) => {
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
                onClick={() => onCellClick && onCellClick(rowLabels[rowIdx], colIdx)}
              />
            );
          }
        }
        return cells;
    }, [rows, cols, cSize, rowLabels, onCellClick]);

    return (
        <svg viewBox={`0 0 ${boardSize} ${boardSize}`} className="game-board">
            {/* Column labels */}
            {colLabels.map((col, i) => (
                <text key={`col-${i}`} x={(cSize - cSize / 10) + cSize / 2 + (i * cSize)} y={cSize / 2 + 10} className="board-label">
                    {col}
                </text>
            ))}

            {/* Row labels */}
            {rowLabels.map((row, i) => (
                <text key={`row-${i}`} x={cSize / 2 - 5} y={(cSize + cSize / 10) + cSize / 2 + (i * cSize)} className="board-label">
                    {row}
                </text>
            ))}

            {/* Draw the grid */}
            {gridCells}
        </svg>
    );
});

export default GameBoard;
