// Create auth page
import React from 'react';
import { AuthForm } from '../elements/auth/authForm';

export function Auth({setAuthData}) {
    const element = (
        <div className="container">
            <AuthForm setAuthData={setAuthData}/>
        </div>
    );
    return element;
}
