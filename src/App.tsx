import './App.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Auth from './lobby/Auth';
import Lobby from './lobby/Lobby';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Auth />} />
                <Route path="/lobby" element={<Lobby />} />
            </Routes>
        </Router>
    );
}

export default App
