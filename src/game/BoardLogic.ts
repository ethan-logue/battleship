import { ShipProps } from '../components/Ship';

/**
 * Get all occupied cells for a given ship.
 */
export const getOccupiedCells = (x: number, y: number, length: number, isVertical: boolean, boardMargin?: number): string[] => {
    if (!boardMargin) boardMargin = 0;
    const cells: string[] = [];
    for (let i = 0; i < length; i++) {
        cells.push(isVertical ? `${x - boardMargin},${(y + i - boardMargin)}` : `${(x + i) - boardMargin},${y - boardMargin}`);
    }
    
    return cells;
};

/**
 * Get all available cells that haven't been guessed yet.
 */
export const getAvailableCells = (rows: number, cols: number, guesses: Map<string, 'hit' | 'miss'>): string[] => {
    const availableCells = Array.from({ length: rows }, (_, row) =>
        Array.from({ length: cols }, (_, col) => `${col},${row}`)
    ).flat();

    return availableCells.filter((cell) => !guesses.has(cell));
};

/**
 * Check if a cell is within the game board bounds.
 */
const isWithinBounds = (cellX: number, cellY: number, boardMargin: number, rows: number, cols: number): boolean => {
    return (
        cellX >= boardMargin &&
        cellX < cols + boardMargin &&
        cellY >= boardMargin &&
        cellY < rows + boardMargin
    );
};

/**
 * Check if a cell is adjacent to any occupied cells.
 */
const isAdjacent = (cellX: number, cellY: number, occupiedCells: Set<string>): boolean => {
    const adjacentCells = [
        `${cellX - 1},${cellY}`, `${cellX + 1},${cellY}`, // Horizontal neighbors
        `${cellX},${cellY - 1}`, `${cellX},${cellY + 1}`, // Vertical neighbors
        `${cellX - 1},${cellY - 1}`, `${cellX + 1},${cellY - 1}`, // Diagonal top
        `${cellX - 1},${cellY + 1}`, `${cellX + 1},${cellY + 1}`, // Diagonal bottom
    ];
    return adjacentCells.some((adjCell) => occupiedCells.has(adjCell));
};

/**
 * Check if a ship placement is valid.
 */
export const isValidPlacement = (
    x: number,
    y: number,
    length: number,
    isVertical: boolean,
    currentShipName: string,
    ships: ShipProps[],
    boardMargin: number,
    rows: number,
    cols: number,
    occupiedCells?: Set<string>
): boolean => {
    const newCells = getOccupiedCells(x, y, length, isVertical);

    // Get all occupied cells except for the current ship
    if (!occupiedCells) {
        occupiedCells = new Set<string>(
            ships
                .filter((ship) => ship.name !== currentShipName)
                .flatMap((ship) => getOccupiedCells(ship.x, ship.y, ship.length, ship.isVertical))
        );
    }
    
    return newCells.every(
        (cell) => {
            const [cellX, cellY] = cell.split(',').map(Number);
            return (
                isWithinBounds(cellX, cellY, boardMargin, rows, cols) &&
                !isAdjacent(cellX, cellY, occupiedCells) &&
                !occupiedCells.has(cell)
            );
        }
    );
};