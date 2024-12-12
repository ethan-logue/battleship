/**
 * Get all occupied cells for a given ship.
 */
export const getOccupiedCells = (x, y, length, isVertical) => {
    const cells = [];
    for (let i = 0; i < length; i++) {
        const cellX = isVertical ? x : x + i;
        const cellY = isVertical ? y + i : y;
        cells.push(`${cellX},${cellY}`);
    }
    return cells;
};

/**
 * Check if a guess hits any ship.
 */
export const isShipHit = (guess, ships, boardMargin) => {
    const hitShip = ships.find((ship) =>
        getOccupiedCells(ship.x, ship.y, ship.length, ship.isVertical, boardMargin).includes(guess)
    );

    if (hitShip) {
        hitShip.hits.add(guess);

        const occupiedCells = getOccupiedCells(hitShip.x, hitShip.y, hitShip.length, hitShip.isVertical, boardMargin);
        const sunk = occupiedCells.every((cell) => hitShip.hits.has(cell));

        return { hit: true, sunk, ship: hitShip };
    }

    return { hit: false, sunk: false };
};

/**
 * Generate a random valid move for the opponent.
 */
export const randomMove = ( numRowsCols, guesses ) => {
    const availableCells = getAvailableCells(numRowsCols, numRowsCols, guesses);

    const remainingCells = availableCells.filter((cell) => !guesses.has(cell));
    if (remainingCells.length === 0) return null;

    return remainingCells[Math.floor(Math.random() * remainingCells.length)];
};