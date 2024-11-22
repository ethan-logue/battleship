import React, { useState } from 'react';
import './Components.css';

interface AuthFormGroupProps {
    name: string;
    type?: string | 'text';
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const AuthFormGroup: React.FC<AuthFormGroupProps> = ({ name, type, onChange }) => {
    const ucName = name.charAt(0).toUpperCase() + name.slice(1);
    const [hasValue, setHasValue] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e);
        setHasValue(e.target.value.length > 0);
    };

    return (
        <div className='auth-form-group'>
            <input className={`auth-input ${hasValue ? 'has-value' : ''}`} type={type} name={name} onChange={handleInputChange} />
            <label className='auth-label' htmlFor={name}>{ucName}</label>
        </div>
    );
};

export default AuthFormGroup;
