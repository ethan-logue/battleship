import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Auth.css';
import AuthFormGroup from '../components/AuthFormGroup';
import { usePlayer } from '../utils/PlayerContext';

const Auth = () => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ username: '', email: '', password: '' });
    const [message, setMessage] = useState('');
    const navigate = useNavigate();
    
    const { setPlayer } = usePlayer();

    const toggleForm = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
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
        const url = isRegister ? 'http://localhost:3000/api/auth/register' : 'http://localhost:3000/api/auth/login';
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

    return (
        <div className='auth-wrapper'>
            <div className='auth-container'>
                <h1 className='auth-title'>BATTLESHIP</h1>

                <div className={`auth-body ${isRegister ? 'grow' : ''}`}>
                    <h2 className='auth-heading'>{isRegister ? 'Register' : 'Login Portal'}</h2>
                    <form className='auth-form' onSubmit={handleSubmit}>
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
                    {message && <p>{message}</p>}
                </div>
                
            </div>
        </div>
    );
};

export default Auth;
