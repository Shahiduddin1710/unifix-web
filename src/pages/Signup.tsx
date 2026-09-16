import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { Eye, EyeOff, GraduationCap, User, ArrowLeft } from '../components/Icons';

type Role = 'student' | 'teacher' | 'staff';

const ROLES: { value: Role; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: 'student', label: 'Student', icon: <GraduationCap size={28} color="#16a34a" />, desc: 'Submit campus repair requests' },
  { value: 'teacher', label: 'Teacher', icon: <User size={28} color="#2563eb" />, desc: 'Must use @vcet.edu.in email' },
];

export default function Signup() {
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async () => {
    setError('');
    if (!name.trim()) return setError('Please enter your full name.');
    if (!email.trim()) return setError('Please enter your email.');
    if (!role) return setError('Please select a role.');
    if ((role === 'student' || role === 'teacher') && !email.trim().toLowerCase().endsWith('@vcet.edu.in')) return setError('Students and teachers must use a @vcet.edu.in email.');
    if (!password) return setError('Please enter a password.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');
    if (!agreed) return setError('Please accept the Terms & Conditions.');
    setLoading(true);
    try {
      await authAPI.signup(name.trim(), email.trim().toLowerCase(), password, role);
      nav(`/otp-verification?email=${encodeURIComponent(email.trim().toLowerCase())}&fullName=${encodeURIComponent(name.trim())}&password=${encodeURIComponent(password)}&role=${role}&type=email-verification`);
    } catch (err: any) {
      setError(err.message || 'Signup failed.');
    } finally { setLoading(false); }
  };

  return (
    <div style={page}>
      <div style={card}>
        <div style={header}>
          <button onClick={() => nav('/login')} style={backBtn}><ArrowLeft size={18} /></button>
          <span style={headerTitle}>UniFiX</span>
          <div style={{ width: 36 }} />
        </div>
        <h1 style={h1}>Create Account</h1>
        <p style={sub}>Join the UniFiX community today</p>

        <label style={lbl}>Full Name</label>
        <div style={iWrap}><input style={inp} placeholder="Enter your full name" value={name} onChange={e => setName(e.target.value)} autoCapitalize="words" /></div>

        <label style={lbl}>College Email</label>
        <div style={iWrap}><input style={inp} type="email" placeholder="email@vcet.edu.in" value={email} onChange={e => setEmail(e.target.value)} /></div>

        <label style={lbl}>Select Role</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
          {ROLES.map(r => (
            <button key={r.value} onClick={() => setRole(r.value)} style={{ ...roleCard, ...(role === r.value ? roleCardActive : {}) }}>
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{r.icon}</span>
              <span style={{ fontSize: 12, fontWeight: role === r.value ? 700 : 600, color: role === r.value ? '#16a34a' : '#94a3b8' }}>{r.label}</span>
            </button>
          ))}
        </div>

        {role && (
          <div style={infoBox}>
            <span style={{ fontSize: 13, color: '#16a34a', lineHeight: 1.5 }}>
              {ROLES.find(r => r.value === role)?.desc}
            </span>
          </div>
        )}

        <label style={lbl}>Password</label>
        <div style={iWrap}>
          <input style={inp} type={showPw ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          <button onClick={() => setShowPw(!showPw)} style={eyeBtn}>{showPw ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}</button>
        </div>

        <label style={lbl}>Confirm Password</label>
        <div style={iWrap}>
          <input style={inp} type={showConfirm ? 'text' : 'password'} placeholder="••••••••" value={confirm} onChange={e => setConfirm(e.target.value)} />
          <button onClick={() => setShowConfirm(!showConfirm)} style={eyeBtn}>{showConfirm ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ width: 20, height: 20, accentColor: '#16a34a' }} />
          <a href="https://unifix-app.onrender.com/terms" target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: '#16a34a', fontWeight: 700 }}>Terms & Conditions</a>
        </div>

        {error && <div style={errBox}>{error}</div>}
        <button onClick={handleSignup} disabled={loading || !agreed} style={{ ...primaryBtn, opacity: loading || !agreed ? 0.45 : 1 }}>{loading ? 'Sending OTP...' : 'Sign Up'}</button>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>Already have an account? </span>
          <Link to="/login" style={{ fontSize: 14, color: '#16a34a', fontWeight: 700 }}>Log in</Link>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 }}>
          <a href="https://unifix-app.onrender.com/terms" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'none' }}>Terms & Conditions</a>
          <span style={{ fontSize: 12, color: '#cbd5e1' }}>·</span>
          <a href="https://unifix-app.onrender.com/privacy" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#94a3b8', textDecoration: 'none' }}>Privacy Policy</a>
        </div>
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: '100dvh', background: '#f8fafc', display: 'flex', justifyContent: 'center' };
const card: React.CSSProperties = { width: '100%', maxWidth: 480, padding: '0 20px 48px', background: '#fff', minHeight: '100dvh' };
const header: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 56, paddingBottom: 4 };
const backBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const headerTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#0f172a' };
const h1: React.CSSProperties = { fontSize: 28, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: -0.5, paddingTop: 16 };
const sub: React.CSSProperties = { fontSize: 14, color: '#64748b', marginBottom: 20 };
const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8, marginTop: 16 };
const iWrap: React.CSSProperties = { display: 'flex', alignItems: 'center', background: '#fff', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '0 14px' };
const inp: React.CSSProperties = { flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: '#0f172a', padding: '14px 0', outline: 'none' };
const eyeBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' };
const roleCard: React.CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', borderRadius: 12, background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'pointer', gap: 8 };
const roleCardActive: React.CSSProperties = { background: '#f0fdf4', borderColor: '#16a34a' };
const infoBox: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 12, marginTop: 12 };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, marginTop: 14, fontSize: 13, color: '#dc2626', textAlign: 'center' };
const primaryBtn: React.CSSProperties = { width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '15px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 20 };