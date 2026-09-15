import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { setAccessToken, setRefreshToken, loadUser, saveUser } from '../utils/auth';
import { GraduationCap } from '../components/Icons';

export default function SelectRole() {
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSelect = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await authAPI.selectRole('student');
      setAccessToken(data.token);
      setRefreshToken(data.refreshToken);
      const user = loadUser();
      saveUser({ ...user, role: 'student' });
      nav('/complete-profile');
    } catch (err: any) {
      setError(err.message || 'Failed to select role.');
    } finally { setLoading(false); }
  };

  return (
    <div style={page}>
      <div style={card}>
        <div style={hero}>
          <div style={iconCircle}><GraduationCap size={44} color="#16a34a" /></div>
          <h1 style={h1}>Welcome to UniFiX</h1>
          <p style={sub}>You're being set up as a student. Tap below to continue.</p>
        </div>
        {error && <div style={errBox}>{error}</div>}
        <button onClick={handleSelect} disabled={loading} style={primaryBtn}>{loading ? 'Setting up...' : 'Continue as Student'}</button>
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: '100dvh', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24 };
const card: React.CSSProperties = { width: '100%', maxWidth: 480, background: '#fff', borderRadius: 20, padding: 32 };
const hero: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 };
const iconCircle: React.CSSProperties = { width: 90, height: 90, borderRadius: 45, background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 };
const h1: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 8, textAlign: 'center' };
const sub: React.CSSProperties = { fontSize: 14, color: '#64748b', textAlign: 'center', lineHeight: 1.6 };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: '#dc2626', textAlign: 'center' };
const primaryBtn: React.CSSProperties = { width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '16px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer' };