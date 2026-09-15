import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { setAccessToken, setRefreshToken } from '../utils/auth';
import { Mail, ArrowLeft } from '../components/Icons';

export default function OtpVerification() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const fullName = params.get('fullName') || '';
  const password = params.get('password') || '';
  const role = params.get('role') || '';
  const type = params.get('type') || 'email-verification';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) { setCanResend(true); return; }
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = (val: string, idx: number) => {
    const c = val.replace(/\D/g, '').slice(0, 1);
    const next = [...otp]; next[idx] = c; setOtp(next);
    if (c && idx < 5) inputs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputs.current[idx - 1]?.focus();
  };

  const handleVerify = async () => {
    setError('');
    const code = otp.join('');
    if (code.length !== 6) return setError('Please enter the complete 6-digit OTP.');
    setLoading(true);
    try {
      if (type === 'email-verification') {
        const data = await authAPI.verifyOtp(email, code, fullName, password, role);
        setAccessToken(data.token);
        setRefreshToken(data.refreshToken);
        nav('/complete-profile');
      } else {
        await authAPI.validateResetOtp(email, code);
        nav(`/reset-password?email=${encodeURIComponent(email)}&otp=${code}`);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed.');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setResending(true); setError('');
    try {
      await authAPI.resendOtp(email, fullName || 'User', type === 'email-verification' ? 'email-verification' : 'password-reset');
      setTimer(60); setCanResend(false); setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } catch (err: any) { setError(err.message || 'Failed to resend.'); }
    finally { setResending(false); }
  };

  return (
    <div style={page}>
      <div style={card}>
        <div style={header}>
          <button onClick={() => nav('/login')} style={backBtn}><ArrowLeft size={18} /></button>
          <span style={title}>UniFiX</span>
          <div style={{ width: 36 }} />
        </div>
        <div style={hero}>
          <div style={iconCircle}><Mail size={32} color="#16a34a" /></div>
          <h1 style={h1}>Verify Email</h1>
          <p style={subp}>We've sent a 6-digit code to</p>
          <p style={emailText}>{email}</p>
        </div>
        <div style={otpRow}>
          {otp.map((d, i) => (
            <input key={i} ref={el => { inputs.current[i] = el; }}
              style={{ ...otpBox, ...(d ? otpBoxFilled : {}) }}
              value={d} maxLength={1} inputMode="numeric"
              onChange={e => handleChange(e.target.value, i)}
              onKeyDown={e => handleKeyDown(e, i)} />
          ))}
        </div>
        {error && <div style={errBox}>{error}</div>}
        <button onClick={handleVerify} disabled={loading} style={primaryBtn}>{loading ? 'Verifying...' : 'Verify Code'}</button>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: '#64748b' }}>
          {"Didn't receive the code? "}
          {!canResend ? <span style={{ color: '#16a34a', fontWeight: 600 }}>Resend in {timer}s</span>
            : <button onClick={handleResend} disabled={resending} style={{ background: 'none', border: 'none', color: '#16a34a', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}>{resending ? 'Resending...' : 'Resend OTP'}</button>}
        </div>
        <div style={{ textAlign: 'center', marginTop: 14 }}>
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
const title: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#0f172a' };
const hero: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 28, paddingBottom: 32 };
const iconCircle: React.CSSProperties = { width: 72, height: 72, borderRadius: 36, background: '#f0fdf4', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 };
const h1: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 8 };
const subp: React.CSSProperties = { fontSize: 14, color: '#64748b', marginBottom: 4 };
const emailText: React.CSSProperties = { fontSize: 14, fontWeight: 700, color: '#0f172a' };
const otpRow: React.CSSProperties = { display: 'flex', gap: 10, marginBottom: 24 };
const otpBox: React.CSSProperties = { flex: 1, height: 52, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', textAlign: 'center', fontSize: 22, fontWeight: 700, color: '#0f172a', outline: 'none' };
const otpBoxFilled: React.CSSProperties = { borderColor: '#16a34a', background: '#f0fdf4', color: '#16a34a' };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, marginBottom: 16, fontSize: 13, color: '#dc2626' };
const primaryBtn: React.CSSProperties = { width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '15px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer' };