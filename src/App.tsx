import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { getValidAccessToken, loadUser } from './utils/auth';

import Login from './pages/Login';
import Signup from './pages/Signup';
import OtpVerification from './pages/OtpVerification';
import ResetPassword from './pages/ResetPassword';
import SelectRole from './pages/SelectRole';
import CompleteProfile from './pages/CompleteProfile';
import Dashboard from './pages/Dashboard';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    getValidAccessToken().then(token => {
      setAuthed(!!token);
      setChecking(false);
 
    });
  }, []);

  if (checking) return <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 40, height: 40, border: '4px solid #f1f5f9', borderTop: '4px solid #16a34a', borderRadius: '50%' }} /></div>;
  return authed ? <>{children}</> : <Navigate to="/login" replace />;
}

function RedirectIfAuth({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [destination, setDestination] = useState('/dashboard');

  useEffect(() => {
    getValidAccessToken().then(token => {
      if (token) {
        setAuthed(true);
        const user = loadUser();
        if (!user?.role) setDestination('/select-role');
        else if (!user?.profileCompleted) setDestination('/complete-profile');
        else setDestination('/dashboard');
      }
      setChecking(false);
    });
  }, []);

  if (checking) return null;
  return authed ? <Navigate to={destination} replace /> : <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; }
        input, textarea, select, button { font-family: inherit; }
        ::-webkit-scrollbar { display: none; }
      `}</style>
      <Routes>
        <Route path="/login" element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
        <Route path="/signup" element={<RedirectIfAuth><Signup /></RedirectIfAuth>} />
        <Route path="/otp-verification" element={<OtpVerification />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/select-role" element={<RequireAuth><SelectRole /></RequireAuth>} />
        <Route path="/complete-profile" element={<RequireAuth><CompleteProfile /></RequireAuth>} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}