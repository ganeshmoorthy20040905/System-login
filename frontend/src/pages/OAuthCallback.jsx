import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const OAuthCallback = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    useEffect(() => {
        const fetchTokens = async () => {
            try {
                const { data } = await api.post('/auth/refresh');

                // Setup initial user Context
                const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
                login({ id: payload.userId, role: payload.role }, data.accessToken);

                navigate('/dashboard');
            } catch (err) {
                navigate('/login?error=true');
            }
        };

        if (searchParams.get('success')) {
            fetchTokens();
        } else {
            navigate('/login');
        }
    }, [navigate]);

    return <div className="min-h-screen flex items-center justify-center">Authenticating...</div>;
};

export default OAuthCallback;
