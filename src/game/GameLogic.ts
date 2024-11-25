import { ShipProps } from "../components/Ship";
import { getAvailableCells, getOccupiedCells } from "./BoardLogic";

/**
 * Check if a guess hits any ship.
 */
export const isShipHit = (guess: string, ships: ShipProps[], boardMargin: number): { hit: boolean; sunk: boolean; ship?: ShipProps } => {
    // Find the ship that was hit
    const hitShip = ships.find((ship) =>
        getOccupiedCells(ship.x, ship.y, ship.length, ship.isVertical, boardMargin).includes(guess)
    );

    if (hitShip) {
        // Add the guess to the ship's hits
        hitShip.hits.add(guess);

        // Check if the ship is sunk
        const occupiedCells = getOccupiedCells(hitShip.x, hitShip.y, hitShip.length, hitShip.isVertical, boardMargin);
        const sunk = occupiedCells.every((cell) => hitShip.hits.has(cell));

        return { hit: true, sunk, ship: hitShip };
    }

    return { hit: false, sunk: false };
};

/**
 * Generate a random valid move for the opponent.
 */
export const randomMove = (
    numRowsCols: number,
    guesses: Map<string, 'hit' | 'miss'>
): string | null => {
    const availableCells = getAvailableCells(numRowsCols, numRowsCols, guesses);

    const remainingCells = availableCells.filter((cell) => !guesses.has(cell));
    if (remainingCells.length === 0) return null;

    return remainingCells[Math.floor(Math.random() * remainingCells.length)];
};