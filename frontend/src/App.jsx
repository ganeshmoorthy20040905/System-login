import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import EmailVerification from './pages/EmailVerification';
import OAuthCallback from './pages/OAuthCallback';

// Error Boundary to prevent white screen crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error('App Error:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1b4b', color: 'white', flexDirection: 'column', gap: '1rem' }}>
          <h2>Something went wrong</h2>
          <button onClick={() => { this.setState({ hasError: false }); window.location.href = '/login'; }}
            style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', background: '#6366f1', color: 'white', border: 'none', cursor: 'pointer' }}>
            Go to Login
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/auth/callback" element={<OAuthCallback />} />

            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/admin-dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/manager-dashboard" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            {/* Fallback: any unknown route goes to Login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
