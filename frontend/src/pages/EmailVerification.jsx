import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api';

const EmailVerification = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying');
    const token = searchParams.get('token');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            return;
        }

        const verify = async () => {
            try {
                await api.post('/auth/verify-email', { token });
                setStatus('success');
            } catch (err) {
                setStatus('error');
            }
        };

        verify();
    }, [token]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
                {status === 'verifying' && <p>Verifying your email...</p>}
                {status === 'success' && (
                    <div>
                        <h2 className="text-2xl font-bold text-green-600 mb-4">Email Verified!</h2>
                        <Link to="/login" className="text-blue-600 hover:text-blue-500 font-medium">Go to Login</Link>
                    </div>
                )}
                {status === 'error' && (
                    <div>
                        <h2 className="text-2xl font-bold text-red-600 mb-4">Verification Failed</h2>
                        <p className="text-gray-600 mb-4">The link is invalid or expired.</p>
                        <Link to="/register" className="text-blue-600 hover:text-blue-500 font-medium">Register Again</Link>
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailVerification;
