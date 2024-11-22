import React, { useMemo } from 'react';
import './Components.css';

interface GameBoardProps {
  cellSize: number;
  numRowsCols?: number;
  onCellClick?: (row: string, col: number) => void;
  occupiedCells?: Set<string>; // Cells occupied by placed ships
  draggedShip?: {
    name: string;
    length: number;
    isVertical: boolean;
  }; // Info about the currently dragged ship
  onDrop?: (x: number, y: number, isVertical: boolean) => void; // Callback for dropping a ship
}

const GameBoard = React.memo(
  ({
    cellSize,
    numRowsCols = 10,
    onCellClick,
    occupiedCells = new Set(),
    draggedShip,
    onDrop,
  }: GameBoardProps) => {
    const rows = numRowsCols;
    const cols = numRowsCols;
    const cSize = cellSize;
    const boardSize = cSize * (rows + 2); // Add 2 for cellSize padding on either side of the grid
    const rowLabels = useMemo(
      () => Array.from({ length: rows }, (_, i) => String.fromCharCode(65 + i)),
      [rows]
    ); // A-J+
    const colLabels = useMemo(() => Array.from({ length: cols }, (_, i) => i), [cols]); // 0-9+

    // Handle mouse hover for previewing placement
    const handleCellHover = (x: number, y: number) => {
      if (!draggedShip) return; // Only preview when dragging a ship

      // Validate placement
      const isValid = validatePlacement(x, y, draggedShip.length, draggedShip.isVertical);

      // Highlight cells (use CSS to visually differentiate valid/invalid)
      const previewCells = document.querySelectorAll('.board-cell');
      previewCells.forEach((cell) => {
        const cellId = cell.id.split('-')[1]; // Extract position (e.g., "A0")
        const [cellRow, cellCol] = [cellId[0], parseInt(cellId.slice(1))];
        const cellX = colLabels.indexOf(cellCol);
        const cellY = rowLabels.indexOf(cellRow);

        if (isValid && isCellInRange(x, y, cellX, cellY, draggedShip.length, draggedShip.isVertical)) {
          cell.classList.add('preview-valid');
          cell.classList.remove('preview-invalid');
        } else if (draggedShip) {
          cell.classList.add('preview-invalid');
          cell.classList.remove('preview-valid');
        } else {
          cell.classList.remove('preview-valid', 'preview-invalid');
        }
      });
    };

    // Validate if placement is within bounds and not overlapping other ships
    const validatePlacement = (x: number, y: number, length: number, isVertical: boolean): boolean => {
      for (let i = 0; i < length; i++) {
        const cellX = isVertical ? x : x + i;
        const cellY = isVertical ? y + i : y;

        // Check bounds
        if (cellX < 0 || cellX >= cols || cellY < 0 || cellY >= rows) return false;

        // Check for overlap
        if (occupiedCells.has(`${cellX},${cellY}`)) return false;
      }
      return true;
    };

    // Utility to check if a cell is in range for a dragged ship's placement
    const isCellInRange = (
      startX: number,
      startY: number,
      cellX: number,
      cellY: number,
      length: number,
      isVertical: boolean
    ): boolean => {
      for (let i = 0; i < length; i++) {
        const checkX = isVertical ? startX : startX + i;
        const checkY = isVertical ? startY + i : startY;

        if (checkX === cellX && checkY === cellY) return true;
      }
      return false;
    };

    // Handle ship drop
    const handleDrop = (x: number, y: number) => {
      if (draggedShip && onDrop) {
        const isValid = validatePlacement(x, y, draggedShip.length, draggedShip.isVertical);
        onDrop(x, y, isValid ? draggedShip.isVertical : false); // Notify parent
      }
    };

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
              onMouseEnter={() => handleCellHover(colIdx, rowIdx)}
              onMouseUp={() => handleDrop(colIdx, rowIdx)} // Handle drop when releasing mouse
            />
          );
        }
      }
      return cells;
    }, [rows, cols, cSize, rowLabels, onCellClick, handleCellHover, handleDrop]);

    return (
      <svg viewBox={`0 0 ${boardSize} ${boardSize}`} className="game-board">
        {/* Column labels */}
        {colLabels.map((col, i) => (
          <text
            key={`col-${i}`}
            x={cSize - cSize / 10 + cSize / 2 + i * cSize}
            y={cSize / 2 + 10}
            className="board-label"
          >
            {col}
          </text>
        ))}

        {/* Row labels */}
        {rowLabels.map((row, i) => (
          <text
            key={`row-${i}`}
            x={cSize / 2 - 5}
            y={cSize + cSize / 10 + cSize / 2 + i * cSize}
            className="board-label"
          >
            {row}
          </text>
        ))}

        {/* Draw the grid */}
        {gridCells}
      </svg>
    );
  }
);

export default GameBoard;
