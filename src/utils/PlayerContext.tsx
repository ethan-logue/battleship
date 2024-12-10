import { createContext, useState, useContext, ReactNode } from 'react';

export interface Player {
    id: number;
    username: string;
    email: string;
    current_lobby_id?: number | null;
    current_game_id?: number | null;
    num_wins?: number;
}

interface PlayerContextType {
    player: Player | null;
    setPlayer: (player: Player | null) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [player, setPlayer] = useState<Player | null>(null);

    return (
        <PlayerContext.Provider value={{ player, setPlayer }}>
            {children}
        </PlayerContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};