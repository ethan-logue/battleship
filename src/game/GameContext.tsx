import React, { createContext, useState } from 'react';
import { ShipProps } from '../components/Ship';

interface GameState {
    isPlayerReady: boolean;
    isOpponentReady: boolean;
    isPlayerTurn: boolean;
    ships: ShipProps[];
    playerGuesses: Map<string, 'hit' | 'miss'>;
    opponentGuesses: Map<string, 'hit' | 'miss'>;
    setPlayerReady: (ready: boolean) => void;
    setOpponentReady: (ready: boolean) => void;
    setPlayerTurn: (turn: boolean) => void;
    updateShips: (ships: ShipProps[]) => void;
    registerGuess: (guess: string, isPlayer: boolean, result: 'hit' | 'miss') => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPlayerReady, setPlayerReady] = useState(false);
    const [isOpponentReady, setOpponentReady] = useState(false);
    const [isPlayerTurn, setPlayerTurn] = useState(true);
    const [ships, setShips] = useState<ShipProps[]>([]);
    const [playerGuesses, setPlayerGuesses] = useState(new Map<string, 'hit' | 'miss'>());
    const [opponentGuesses, setOpponentGuesses] = useState(new Map<string, 'hit' | 'miss'>());

    const updateShips = (updatedShips: ShipProps[]) => {
        setShips(updatedShips);
    };

    const registerGuess = (guess: string, isPlayer: boolean, result: 'hit' | 'miss') => {
        if (isPlayer) {
            setPlayerGuesses((prev) => new Map(prev).set(guess, result));
        } else {
            setOpponentGuesses((prev) => new Map(prev).set(guess, result));
        }
    };

    return (
        <GameContext.Provider
            value={{
                isPlayerReady,
                isOpponentReady,
                isPlayerTurn,
                ships,
                playerGuesses,
                opponentGuesses,
                setPlayerReady,
                setOpponentReady,
                setPlayerTurn,
                updateShips,
                registerGuess,
            }}
        >
            {children}
        </GameContext.Provider>
    );
};

