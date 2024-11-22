import './App.css'
import { BrowserRouter as Router, Route, Routes, Navigate  } from 'react-router-dom';
import Auth from './login/Auth';
import Lobby from './lobby/Lobby';
import Game from './game/Game';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Auth />} />
                {/* <Route path="/" element={<Auth />} /> */}
                <Route path="/lobby" element={<Lobby />} />
                <Route path="/game" element={<Game />} />
            </Routes>
        </Router>
    );
}

export default App
