import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayer } from '../utils/PlayerContext';
import { baseUrl } from '../utils/apiUtils';
import AuthFormGroup from '../components/AuthFormGroup';
import socket from '../utils/socket';
import './Auth.css';

const Auth = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    
    const { setPlayer } = usePlayer();

    const toggleForm = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        setMessage('');
        setIsRegister(!isRegister);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.email || !formData.password || (isRegister && !formData.username)) {
            setMessage('Please fill in all fields');
            return;
        }
        const url = isRegister ? `${baseUrl}/api/auth/register` : `${baseUrl}/api/auth/login`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData),
        });

        const result = await response.json();
        if (response.ok) {
            if (!isRegister) {
                localStorage.setItem('token', result.token);
                socket.emit('login', result.user.username, result.user.id, result.user.email, result.token);
                setPlayer(result.user);
                navigate('/lobby');
            } else {
                setMessage('Registration successful! Please log in.');
                setIsRegister(false);
            }
        } else {
            setMessage(result.error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLFormElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className='auth-wrapper'>
            <div className='auth-container'>
                <h1 className='auth-title'>BATTLESHIP</h1>

                <div className={`auth-body ${isRegister ? 'grow' : ''}`}>
                    <h2 className='auth-heading'>{isRegister ? 'Register' : 'Login Portal'}</h2>
                    {message && <p>{message}</p>}
                    <form className='auth-form' onSubmit={handleSubmit} onKeyDown={handleKeyPress}>
                        {isRegister && (
                            <AuthFormGroup name='username' onChange={handleInputChange} />
                        )}
                        <AuthFormGroup name='email' type='email' onChange={handleInputChange} />
                        <AuthFormGroup name='password' type='password' onChange={handleInputChange} />

                        <div className='auth-btns'>
                            <button className='auth-toggle' onClick={toggleForm}>
                                {isRegister ? 'Returning User? Login' : 'New User? Register Here'}
                            </button>
                            <button className='auth-submit' type="submit">{isRegister ? 'Register' : 'Login'}</button>
                        </div>
                        
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Auth;
