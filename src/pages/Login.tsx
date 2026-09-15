import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { authAPI } from '../utils/api';
import { setAccessToken, setRefreshToken, saveUser } from '../utils/auth';
import { Mail, Lock, Eye, EyeOff } from '../components/Icons';

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const navigateByUser = (userData: any, token: string, refreshToken: string) => {
    setAccessToken(token);
    setRefreshToken(refreshToken);
    saveUser(userData);
    if (!userData.role) { nav('/select-role'); return; }
    if (!userData.profileCompleted) { nav('/complete-profile'); return; }
    nav('/dashboard');
  };

  const handleLogin = async () => {
    setError(''); setResetMsg('');
    if (!email.trim()) return setError('Please enter your email.');
    if (!password) return setError('Please enter your password.');
    setLoading(true);
    try {
      const data = await authAPI.login(email.trim().toLowerCase(), password);
      navigateByUser(data.user, data.token, data.refreshToken);
    } catch (err: any) {
      if (err.code === 'GOOGLE_ACCOUNT') setError('Your email is verified with Google. Please continue with Google.');
      else setError(err.message || 'Login failed.');
    } finally { setLoading(false); }
  };

  const handleGoogle = async () => {
    setError(''); setGoogleLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleEmail = result.user.email ?? '';
      if (!googleEmail.endsWith('@vcet.edu.in')) {
        setError('Only VCET email accounts (@vcet.edu.in) are allowed.');
        await auth.signOut();
        return;
      }
      const idToken = await result.user.getIdToken();
      const data = await authAPI.googleSignIn(idToken);
      navigateByUser(data.user, data.token, data.refreshToken);
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') return;
      if (err.code === 'EXISTING_PASSWORD_ACCOUNT') setError('This email has an existing account. Please log in with email and password.');
      else setError(err.message || 'Google sign-in failed.');
    } finally { setGoogleLoading(false); }
  };

  const handleForgot = async () => {
    setError(''); setResetMsg('');
    if (!email.trim()) return setError('Enter your email above, then tap Forgot Password.');
    setForgotLoading(true);
    try {
      await authAPI.forgotPassword(email.trim().toLowerCase());
      setResetMsg('OTP sent to your email!');
      setTimeout(() => nav(`/otp-verification?email=${encodeURIComponent(email.trim().toLowerCase())}&type=password-reset&fullName=User`), 1500);
    } catch (err: any) {
      if (err.code === 'GOOGLE_ACCOUNT') setError('Your email is verified with Google. Please continue with Google.');
      else setError(err.message || 'Could not send OTP.');
    } finally { setForgotLoading(false); }
  };

  return (
    <div style={page}>
      <div style={card}>
        <div style={hero}>
      <div style={logoWrap}>
<img
    src="/icon.png"
    alt="UniFiX"
    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
  />
</div>
        </div>
        <h1 style={h1}>Welcome to UniFiX</h1>
        <p style={sub}>Sign in to your account</p>

        <label style={lbl}>Email Address</label>
        <div style={inputWrap}>
          <span style={iconWrap}><Mail size={16} color="#94a3b8" /></span>
          <input style={inp} type="email" placeholder="email@vcet.edu.in" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 }}>
          <label style={lbl}>Password</label>
          <button onClick={handleForgot} disabled={forgotLoading} style={forgotBtn}>{forgotLoading ? '...' : 'Forgot password?'}</button>
        </div>
        <div style={inputWrap}>
          <span style={iconWrap}><Lock size={16} color="#94a3b8" /></span>
          <input style={inp} type={showPw ? 'text' : 'password'} placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <button onClick={() => setShowPw(!showPw)} style={eyeBtn}>{showPw ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}</button>
        </div>

        {error && <div style={errBox}>{error}</div>}
        {resetMsg && <div style={successBox}>{resetMsg}</div>}

        <button onClick={handleLogin} disabled={loading} style={primaryBtn}>{loading ? 'Logging in...' : 'Log In'}</button>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 14, color: '#64748b' }}>{"Don't have an account? "}</span>
          <Link to="/signup" style={{ fontSize: 14, color: '#16a34a', fontWeight: 700 }}>Sign Up</Link>
        </div>

        <div style={divRow}>
          <div style={divLine} /><span style={divLabel}>or continue with</span><div style={divLine} />
        </div>

        <button onClick={handleGoogle} disabled={googleLoading} style={googleBtn}>
          {googleLoading ? 'Signing in...' : (
            <><svg width={20} height={20} viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
            <span>Continue with Google</span></>
          )}
        </button>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#94a3b8' }}>
          By continuing, you agree to our <Link to="/legal" style={{ color: '#16a34a', fontWeight: 700 }}>Terms & Conditions</Link>
        </div>
      </div>
    </div>
  );
}

const page: React.CSSProperties = { minHeight: '100dvh', background: '#f8fafc', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' };
const card: React.CSSProperties = { width: '100%', maxWidth: 480, padding: '0 24px 40px', background: '#fff', minHeight: '100dvh' };
const hero: React.CSSProperties = { display: 'flex', justifyContent: 'center', paddingTop: 60, paddingBottom: 24 };
const logoWrap: React.CSSProperties = { width: 90, height: 90, borderRadius: '50%', overflow: 'hidden', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const h1: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: -0.3 };
const sub: React.CSSProperties = { fontSize: 14, color: '#64748b', marginBottom: 24 };
const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8 };
const inputWrap: React.CSSProperties = { display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '0 14px' };
const iconWrap: React.CSSProperties = { marginRight: 10, display: 'flex', alignItems: 'center' };
const inp: React.CSSProperties = { flex: 1, border: 'none', background: 'transparent', fontSize: 15, color: '#0f172a', padding: '14px 0', outline: 'none' };
const eyeBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' };
const forgotBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: 13, fontWeight: 600 };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, marginTop: 14, fontSize: 13, color: '#dc2626', textAlign: 'center' };
const successBox: React.CSSProperties = { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: 12, marginTop: 14, fontSize: 13, color: '#16a34a', textAlign: 'center' };
const primaryBtn: React.CSSProperties = { width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '15px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 22 };
const divRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0' };
const divLine: React.CSSProperties = { flex: 1, height: 1, background: '#f1f5f9' };
const divLabel: React.CSSProperties = { fontSize: 12, color: '#94a3b8' };
const googleBtn: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 600, color: '#374151', cursor: 'pointer' };