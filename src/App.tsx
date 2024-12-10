import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate  } from 'react-router-dom';
import Auth from './login/Auth';
import Lobby from './lobby/Lobby';
import Game from './game/Game';
import { PlayerProvider } from './utils/PlayerContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
    return (
        <PlayerProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Auth />} />
                    <Route path="/lobby" element={<ProtectedRoute><Lobby /></ProtectedRoute>} />
                    <Route path="/game/:gameId" element={<ProtectedRoute><Game /></ProtectedRoute>} />
                </Routes>
            </Router>
        </PlayerProvider>
    );
}

export default App
