import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data } = await api.post('/auth/refresh');
                if (data?.accessToken) {
                    const payload = JSON.parse(atob(data.accessToken.split('.')[1]));
                    setUser({ id: payload.userId, role: payload.role });
                }
            } catch (error) {
                console.log('Session refresh failed (expected if not logged in)');
            } finally {
                setLoading(false);
            }
        };
        initAuth();
    }, []);

    const login = (userData, accessToken) => {
        setUser(userData);
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (e) { }
        setUser(null);
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-900">Loading Session...</div>;

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
