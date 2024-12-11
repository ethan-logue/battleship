import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import socket from './socket';

export interface Player {
    socketId: string;
    id: number;
    username: string;
    email: string;
    currentLobbyId?: number | null;
    currentGameId?: string | null;
    num_wins?: number;
}

interface PlayerContextType {
    player: Player | null;
    setPlayer: (player: Player | null) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [player, setPlayer] = useState<Player | null>(null);

    useEffect(() => {
        socket.on('setSocketId', (id, socketId: string) => {
            if (player && player.id === id) {
                setPlayer({ ...player, socketId });
            }
        });
    });

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