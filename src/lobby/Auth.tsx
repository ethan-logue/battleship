import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Auth = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [message, setMessage] = useState('');
    // const [isLoggedIn, setIsLoggedIn] = useState(false);
    // const [lobbyData, setLobbyData] = useState(null);

    const toggleForm = () => setIsRegister(!isRegister);

    const navigate = useNavigate(); // Hook for redirection

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const response = await fetch('http://localhost:8000/login.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(formData),
        });
        const result = await response.json();

        if (result.status === 'success') {
            navigate('/lobby'); // Redirect to lobby on success
        } else {
            setMessage(result.message);
        }
    };

    return (
        <div className='auth-wrapper'>
            <div className='auth-container'>
                <h1 className='auth-title'>BATTLESHIP</h1>
                <div className='auth-body'>
                    <h2 className='auth-heading'>{isRegister ? 'Register' : 'Login Portal'}</h2>
                    <form className='auth-form' onSubmit={handleSubmit}>
                        {isRegister && (
                            <input className='auth-input' type="text" name="username" placeholder="Username" onChange={handleInputChange} />
                        )}
                        <input className='auth-input' type="email" name="email" placeholder="Email" onChange={handleInputChange} />
                        <input className='auth-input' type="password" name="password" placeholder="Password" onChange={handleInputChange} />
                        <div className='auth-btns'>
                            <button className='auth-toggle' onClick={toggleForm}>
                                {isRegister ? 'Returning User? Login' : 'New User? Register Here'}
                            </button>
                            <button className='auth-submit' type="submit">{isRegister ? 'Register' : 'Login'}</button>
                        </div>
                    </form>
                    {message && <p>{message}</p>}
                </div>
            </div>
        </div>
    );
};

export default Auth;
