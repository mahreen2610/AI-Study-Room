import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import useAuth from './hooks/useAuth';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';
import NotFound from './pages/NotFound';

/**
 * Route protection wrapper for authorized users only.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  console.log(`[ProtectedRoute] user: ${user ? user.email : 'null'}, loading: ${loading}`);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No user found, redirecting to /login');
    return <Navigate to="/login" replace />;
  }

  return children;
}

/**
 * Route protection wrapper for guest/public pages (redirects logged-in users).
 */
function PublicRoute({ children }) {
  const { user, loading } = useAuth();

  console.log(`[PublicRoute] user: ${user ? user.email : 'null'}, loading: ${loading}`);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-primary)' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (user) {
    console.log('[PublicRoute] User found, redirecting to /dashboard');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Guest Landing */}
          <Route path="/" element={<Landing />} />

          {/* Auth Pages (Redirect to dashboard if logged in) */}
          <Route 
            path="/login" 
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <PublicRoute>
                <Signup />
              </PublicRoute>
            } 
          />

          {/* Dashboard (Protected) */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Individual Study Room Workspace (Protected) */}
          <Route 
            path="/rooms/:roomId" 
            element={
              <ProtectedRoute>
                <Room />
              </ProtectedRoute>
            } 
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
