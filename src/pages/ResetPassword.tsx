import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { Lock, Eye, EyeOff, ArrowLeft } from '../components/Icons';

export default function ResetPassword() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const otp = params.get('otp') || '';
  const [newPw, setNewPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const rules = [
    { label: 'At least 6 characters', ok: newPw.length >= 6 },
    { label: 'Passwords match', ok: newPw === confirm && confirm.length > 0 },
  ];

  const handleReset = async () => {
    setError(''); setSuccess('');
    if (!newPw.trim()) return setError('Please enter new password.');
    if (newPw.length < 6) return setError('Password must be at least 6 characters.');
    if (newPw !== confirm) return setError('Passwords do not match.');
    if (!email || !otp) return setError('Invalid reset session. Please start over.');
    setLoading(true);
    try {
      await authAPI.verifyResetOtp(email, otp, newPw);
      setSuccess('Password reset successfully!');
      setTimeout(() => nav('/login'), 1500);
    } catch (err: any) { setError(err.message || 'Reset failed.'); }
    finally { setLoading(false); }
  };

  return (
    <div style={page}>
      <div style={card}>
        <div style={header}>
          <button onClick={() => nav('/login')} style={backBtn}><ArrowLeft size={18} /></button>
          <span style={hTitle}>UniFiX</span>
          <div style={{ width: 36 }} />
        </div>
        <div style={hero}>
          <div style={iconCircle}><Lock size={32} color="#16a34a" /></div>
          <h1 style={h1}>Create New Password</h1>
          <p style={sub}>Enter a new password for {email}</p>
        </div>
        <label style={lbl}>New Password</label>
        <div style={iWrap}>
          <input style={inp} type={showNew ? 'text' : 'password'} placeholder="Enter new password" value={newPw} onChange={e => setNewPw(e.target.value)} />
          <button onClick={() => setShowNew(!showNew)} style={eyeBtn}>{showNew ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}</button>
        </div>
        <label style={lbl}>Confirm Password</label>
        <div style={iWrap}>
          <input style={inp} type={showConfirm ? 'text' : 'password'} placeholder="Confirm new password" value={confirm} onChange={e => setConfirm(e.target.value)} />
          <button onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn}>{showConfirm ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}</button>
        </div>
        <div style={rulesBox}>
          {rules.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: r.ok ? '#16a34a' : '#94a3b8', fontSize: 14 }}>{r.ok ? '✓' : '○'}</span>
              <span style={{ fontSize: 13, color: r.ok ? '#16a34a' : '#94a3b8' }}>{r.label}</span>
            </div>
          ))}
        </div>
        {error && <div style={errBox}>{error}</div>}
        {success && <div style={successBox}>{success}</div>}
        <button onClick={handleReset} disabled={loading} style={primaryBtn}>{loading ? 'Resetting...' : 'Reset Password'}</button>
        <div style={{ textAlign: 'center', marginTop: 18 }}>
          <button onClick={() => nav('/login')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer' }}>Back to login</button>
        </div>
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: '100dvh', background: '#f8fafc', display: 'flex', justifyContent: 'center' };
const card: React.CSSProperties = { width: '100%', maxWidth: 480, padding: '0 20px 48px', background: '#fff', minHeight: '100dvh' };
const header: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 4 };
const backBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const hTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#0f172a' };
const hero: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 28, paddingBottom: 32 };
const iconCircle: React.CSSProperties = { width: 72, height: 72, borderRadius: 36, background: '#f0fdf4', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 };
const h1: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 8 };
const sub: React.CSSProperties = { fontSize: 14, color: '#64748b', textAlign: 'center' };
const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8, marginTop: 16 };
const iWrap: React.CSSProperties = { display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '0 14px' };
const inp: React.CSSProperties = { flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: '#0f172a', padding: '14px 0', outline: 'none' };
const eyeBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' };
const rulesBox: React.CSSProperties = { background: '#f8fafc', borderRadius: 10, padding: 14, marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, marginTop: 14, fontSize: 13, color: '#dc2626' };
const successBox: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 12, marginTop: 14, fontSize: 13, color: '#16a34a' };
const primaryBtn: React.CSSProperties = { width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '15px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 24 };