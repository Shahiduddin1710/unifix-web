import React, { useState, useMemo, useCallback } from 'react';
import { authAPI } from '../utils/api';
import { uploadToCloudinary } from '../utils/cloudinary';
import { Camera, User, Settings, Info, Lock, LogOut, Trash2, Shield, Phone, Eye, EyeOff, Upload, TriangleAlert, ChevronRight, ArrowLeft, GraduationCap } from '../components/Icons';

type Screen = 'main' | 'personalInfo' | 'changePassword' | 'reportSecurity' | 'legal' | 'settings';
interface Props { userData: any; onLogout: () => void; hasPendingIdCard: boolean; onIdCardUpdate: () => void; }

const SECURITY_TYPES = ['Unauthorized Access', 'Account Compromise', 'Data Privacy Concern', 'Suspicious Activity', 'Password Issue', 'Other'];

export default function ProfileSection({ userData, onLogout, hasPendingIdCard, onIdCardUpdate }: Props) {
  const [screen, setScreen] = useState<Screen>('main');
  const [history, setHistory] = useState<Screen[]>([]);
  const nav = useCallback((s: Screen) => { setHistory(h => [...h, screen]); setScreen(s); }, [screen]);
  const back = useCallback(() => setHistory(h => { const n = [...h]; const prev = n.pop(); setScreen(prev || 'main'); return n; }), []);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [photoUploading, setPhotoUploading] = useState(false);
  const [curPw, setCurPw] = useState(''); const [newPw, setNewPw] = useState(''); const [confirmPw, setConfirmPw] = useState('');
  const [showCur, setShowCur] = useState(false); const [showNew, setShowNew] = useState(false); const [showConf, setShowConf] = useState(false);
  const [pwLoading, setPwLoading] = useState(false); const [pwError, setPwError] = useState(''); const [pwSuccess, setPwSuccess] = useState('');
  const [secType, setSecType] = useState(''); const [secDesc, setSecDesc] = useState('');
  const [secLoading, setSecLoading] = useState(false); const [secError, setSecError] = useState(''); const [secSuccess, setSecSuccess] = useState('');
  const [idCardUploading, setIdCardUploading] = useState(false); const [idCardError, setIdCardError] = useState(''); const [idCardSuccess, setIdCardSuccess] = useState('');

  const isGoogle = userData?.authProvider === 'google';
  const firstName = useMemo(() => (userData?.fullName?.split(' ')[0] ?? 'User'), [userData]);
  const idCardUrl = useMemo(() => userData?.studentIdCardUrl || userData?.teacherIdCardUrl || null, [userData]);
  const avatarLetters = userData?.fullName?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'U';

  const handlePickPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setPhotoUploading(true);
    try { const url = await uploadToCloudinary(file, 'profiles'); await authAPI.completeProfile({ photoUrl: url }); onIdCardUpdate(); }
    catch {} finally { setPhotoUploading(false); }
  };

  const handleSaveProfile = async () => {
    setProfileError(''); setProfileSuccess('');
    if (!editName.trim()) return setProfileError('Full name is required.');
    if (editPhone && !/^[6-9]\d{9}$/.test(editPhone.trim())) return setProfileError('Enter a valid 10-digit Indian phone number.');
    setProfileSaving(true);
    try { await authAPI.updateProfile(editName.trim(), editPhone.trim()); onIdCardUpdate(); setProfileSuccess('Profile updated successfully.'); }
    catch (err: any) { setProfileError(err.message || 'Failed.'); } finally { setProfileSaving(false); }
  };

  const handleChangePw = async () => {
    setPwError(''); setPwSuccess('');
    if (!curPw || !newPw || !confirmPw) return setPwError('All fields are required.');
    if (newPw.length < 8) return setPwError('Password must be at least 8 characters.');
    if (!/[A-Z]/.test(newPw)) return setPwError('Must contain at least one uppercase letter.');
    if (!/[0-9]/.test(newPw)) return setPwError('Must contain at least one number.');
    if (newPw !== confirmPw) return setPwError('Passwords do not match.');
    setPwLoading(true);
    try { await authAPI.changePassword(curPw, newPw); setPwSuccess('Password changed successfully.'); setCurPw(''); setNewPw(''); setConfirmPw(''); }
    catch (err: any) { setPwError(err.message || 'Failed.'); } finally { setPwLoading(false); }
  };

  const handleSecurityReport = async () => {
    setSecError(''); setSecSuccess('');
    if (!secType) return setSecError('Please select an issue type.');
    if (!secDesc.trim()) return setSecError('Please describe the issue.');
    setSecLoading(true);
    try { await authAPI.reportSecurityIssue(secType, secDesc.trim()); setSecSuccess('Security issue reported successfully.'); setSecType(''); setSecDesc(''); }
    catch (err: any) { setSecError(err.message || 'Failed.'); } finally { setSecLoading(false); }
  };

  const handleIdCardUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIdCardError(''); setIdCardSuccess(''); setIdCardUploading(true);
    try {
      const folder = userData?.role === 'student' ? 'student_documents' : 'teacher_documents';
      const url = await uploadToCloudinary(file, folder);
      await authAPI.requestIdCardUpdate(url, file.name);
      setIdCardSuccess('ID card update request submitted. Admin will review it shortly.'); onIdCardUpdate();
    } catch (err: any) { setIdCardError(err.message || 'Upload failed.'); } finally { setIdCardUploading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm(userData?.role === 'staff' ? 'Your deletion request will be sent to admin for approval.' : 'This will permanently delete your account. Cannot be undone.')) return;
    try { const data = await authAPI.deleteAccount(); if (data.requiresApproval) alert('Your account deletion request has been submitted and is under review.'); else onLogout(); }
    catch (err: any) { alert(err.message || 'Failed.'); }
  };

  const handleLogoutAll = async () => {
    if (!window.confirm('This will end all active sessions on all devices.')) return;
    try { await authAPI.logoutAllDevices(); onLogout(); } catch {}
  };

  if (screen === 'personalInfo') return (
    <div style={scrollWrap}>
      <div style={subHeader}><button onClick={back} style={backBtn}><ArrowLeft size={18} /></button><span style={subTitle}>Personal Information</span></div>
      <div style={desktopFormGrid}>
        <div style={formCard}>
          <div style={formSectionLbl}>BASIC INFO</div>
          <FormField label="Full Name"><input style={formInp} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Enter your full name" /></FormField>
          <FormField label="Email"><div style={readOnly}><span style={{ flex: 1, fontSize: 14, color: '#64748b' }}>{userData?.email}</span><span style={readOnlyTag}>Read only</span></div></FormField>
          <FormField label="Phone"><input style={formInp} value={editPhone} onChange={e => setEditPhone(e.target.value)} placeholder="10-digit phone" type="tel" maxLength={10} /></FormField>
          <FormField label="Gender"><div style={readOnly}><span style={{ flex: 1, fontSize: 14, color: '#64748b' }}>{userData?.gender || 'Not set'}</span><span style={readOnlyTag}>Read only</span></div></FormField>
          <FormField label="Role"><div style={readOnly}><span style={{ flex: 1, fontSize: 14, color: '#64748b' }}>{userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : '—'}</span><span style={readOnlyTag}>Read only</span></div></FormField>
          {userData?.rollNumber && <FormField label="Roll Number"><div style={readOnly}><span style={{ flex: 1, fontSize: 14, color: '#64748b' }}>{userData.rollNumber}</span><span style={readOnlyTag}>Read only</span></div></FormField>}
          {profileError && <div style={formErr}>{profileError}</div>}
          {profileSuccess && <div style={formOk}>{profileSuccess}</div>}
          <button onClick={handleSaveProfile} disabled={profileSaving} style={saveBtn}>{profileSaving ? 'Saving...' : 'Save Changes'}</button>
        </div>
        {(userData?.role === 'student' || userData?.role === 'teacher') && (
          <div style={formCard}>
            <div style={formSectionLbl}>ID CARD MANAGEMENT</div>
            {idCardUrl ? <img src={idCardUrl} alt="ID" style={{ width: '100%', height: 200, borderRadius: 10, objectFit: 'contain', marginBottom: 12, border: '1px solid #e2e8f0' }} /> : <div style={idEmpty}>No ID card uploaded</div>}
            <div style={privacyNote}><Shield size={14} color="#64748b" /> Your ID card is only visible to you and the Admin.</div>
            {hasPendingIdCard ? (
              <div style={pendingBadge}>ID card update request is pending admin review</div>
            ) : (
              <label style={idUploadBtn}>
                <Upload size={16} color="#16a34a" />
                {idCardUploading ? 'Uploading...' : 'Request ID Card Update'}
                <input type="file" accept="image/*,.pdf" onChange={handleIdCardUpload} style={{ display: 'none' }} />
              </label>
            )}
            {idCardError && <div style={formErr}>{idCardError}</div>}
            {idCardSuccess && <div style={formOk}>{idCardSuccess}</div>}
          </div>
        )}
      </div>
    </div>
  );

  if (screen === 'changePassword') return (
    <div style={scrollWrap}>
      <div style={subHeader}><button onClick={back} style={backBtn}><ArrowLeft size={18} /></button><span style={subTitle}>Change Password</span></div>
      <div style={{ maxWidth: 560 }}>
        {isGoogle ? (
          <div style={formCard}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, fontWeight: 800, color: '#16a34a', marginBottom: 12 }}>G</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Your account uses Google Sign-In</div>
              <div style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.6 }}>Password changes are managed through your Google Account.</div>
              <button onClick={back} style={saveBtn}>Back to Settings</button>
            </div>
          </div>
        ) : (
          <div style={formCard}>
            <div style={formSectionLbl}>UPDATE PASSWORD</div>
            <FormField label="Current Password">
              <div style={pwWrap}><input style={pwInp} type={showCur ? 'text' : 'password'} value={curPw} onChange={e => setCurPw(e.target.value)} placeholder="Enter current password" /><button onClick={() => setShowCur(!showCur)} style={eyeBtn}>{showCur ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}</button></div>
            </FormField>
            <FormField label="New Password">
              <div style={pwWrap}><input style={pwInp} type={showNew ? 'text' : 'password'} value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Enter new password" /><button onClick={() => setShowNew(!showNew)} style={eyeBtn}>{showNew ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}</button></div>
            </FormField>
            <FormField label="Confirm Password">
              <div style={pwWrap}><input style={pwInp} type={showConf ? 'text' : 'password'} value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Confirm new password" /><button onClick={() => setShowConf(!showConf)} style={eyeBtn}>{showConf ? <EyeOff size={16} color="#94a3b8" /> : <Eye size={16} color="#94a3b8" />}</button></div>
            </FormField>
            <div style={rulesBox}>
              {[{ l: 'At least 8 characters', ok: newPw.length >= 8 }, { l: 'One uppercase letter', ok: /[A-Z]/.test(newPw) }, { l: 'One number', ok: /[0-9]/.test(newPw) }, { l: 'Passwords match', ok: newPw === confirmPw && confirmPw.length > 0 }].map(r => (
                <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ color: r.ok ? '#16a34a' : '#94a3b8' }}>{r.ok ? '✓' : '○'}</span><span style={{ fontSize: 13, color: r.ok ? '#16a34a' : '#94a3b8' }}>{r.l}</span></div>
              ))}
            </div>
            {pwError && <div style={formErr}>{pwError}</div>}
            {pwSuccess && <div style={formOk}>{pwSuccess}</div>}
            <button onClick={handleChangePw} disabled={pwLoading || !curPw || !newPw || !confirmPw} style={{ ...saveBtn, opacity: pwLoading || !curPw || !newPw || !confirmPw ? 0.6 : 1 }}>{pwLoading ? 'Changing...' : 'Change Password'}</button>
          </div>
        )}
      </div>
    </div>
  );

  if (screen === 'reportSecurity') return (
    <div style={scrollWrap}>
      <div style={subHeader}><button onClick={back} style={backBtn}><ArrowLeft size={18} /></button><span style={subTitle}>Report Security Issue</span></div>
      <div style={{ maxWidth: 560 }}>
        <div style={formCard}>
          <div style={formSectionLbl}>ISSUE DETAILS</div>
          <FormField label="Issue Type">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SECURITY_TYPES.map(t => (
                <button key={t} onClick={() => setSecType(t)} style={{ padding: '8px 14px', borderRadius: 20, border: `1.5px solid ${secType === t ? '#16a34a' : '#e2e8f0'}`, background: secType === t ? '#f0fdf4' : '#f8fafc', fontSize: 13, fontWeight: 600, color: secType === t ? '#16a34a' : '#64748b', cursor: 'pointer' }}>{t}</button>
              ))}
            </div>
          </FormField>
          <FormField label="Description">
            <textarea style={{ ...formInp, minHeight: 120, resize: 'vertical' } as any} value={secDesc} onChange={e => setSecDesc(e.target.value)} placeholder="Describe the security issue in detail..." />
          </FormField>
          {secError && <div style={formErr}>{secError}</div>}
          {secSuccess && <div style={formOk}>{secSuccess}</div>}
          <button onClick={handleSecurityReport} disabled={secLoading || !secType || !secDesc.trim()} style={{ ...saveBtn, opacity: secLoading || !secType || !secDesc.trim() ? 0.6 : 1 }}>{secLoading ? 'Submitting...' : 'Submit Report'}</button>
        </div>
      </div>
    </div>
  );

  if (screen === 'settings') return (
    <div style={scrollWrap}>
      <div style={subHeader}><button onClick={back} style={backBtn}><ArrowLeft size={18} /></button><span style={subTitle}>Settings</span></div>
      <div style={{ maxWidth: 560 }}>
        <div style={formCard}>
          <div style={formSectionLbl}>ACCOUNT</div>
          {[
            { label: 'Change Password', icon: <Lock size={18} color="#16a34a" />, bg: '#f0fdf4', action: () => { setCurPw(''); setNewPw(''); setConfirmPw(''); setPwError(''); setPwSuccess(''); nav('changePassword'); } },
            { label: 'Logout from All Devices', icon: <LogOut size={18} color="#16a34a" />, bg: '#f0fdf4', action: handleLogoutAll },
            { label: 'Report Security Issue', icon: <Shield size={18} color="#16a34a" />, bg: '#f0fdf4', action: () => { setSecType(''); setSecDesc(''); setSecError(''); setSecSuccess(''); nav('reportSecurity'); } },
            { label: 'Delete Account', icon: <Trash2 size={18} color="#dc2626" />, bg: '#fef2f2', action: handleDeleteAccount, danger: true },
          ].map((item, i, arr) => (
            <React.Fragment key={item.label}>
              <button onClick={item.action} style={{ ...secRow, color: (item as any).danger ? '#dc2626' : '#0f172a' }}>
                <div style={{ ...menuIcon, background: item.bg }}>{item.icon}</div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{item.label}</span>
                <ChevronRight size={16} color={(item as any).danger ? '#dc2626' : '#94a3b8'} />
              </button>
              {i < arr.length - 1 && <div style={{ height: 1, background: '#f8fafc', margin: '0 8px' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );

  if (screen === 'legal') return (
    <div style={scrollWrap}>
      <div style={subHeader}><button onClick={back} style={backBtn}><ArrowLeft size={18} /></button><span style={subTitle}>Legal</span></div>
      <div style={{ maxWidth: 560 }}>
        {[{ label: 'Terms & Conditions', icon: <Info size={18} color="#0369a1" />, bg: '#f0f9ff' }, { label: 'Privacy Policy', icon: <Shield size={18} color="#0369a1" />, bg: '#f0f9ff' }, { label: 'Copyright', icon: <Info size={18} color="#0369a1" />, bg: '#f0f9ff' }].map(item => (
          <div key={item.label} style={menuCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
              <div style={{ ...menuIcon, background: item.bg }}>{item.icon}</div>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{item.label}</span>
            </div>
            <ChevronRight size={16} color="#94a3b8" />
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={scrollWrap}>
      <div style={profileHero}>
        <label style={{ position: 'relative', cursor: 'pointer' }}>
          {userData?.photoUrl ? (
            <img src={userData.photoUrl} alt="avatar" style={{ width: 90, height: 90, borderRadius: 45, border: '2px solid #16a34a', objectFit: 'cover' }} />
          ) : (
            <div style={avatar}><span style={{ fontSize: 32, fontWeight: 800, color: '#16a34a' }}>{avatarLetters}</span></div>
          )}
          <div style={cameraBtn}>{photoUploading ? <span style={{ fontSize: 10, color: '#fff' }}>...</span> : <Camera size={14} color="#fff" />}</div>
          <input type="file" accept="image/*" onChange={handlePickPhoto} style={{ display: 'none' }} />
        </label>
        <div style={profileName}>{userData?.fullName ?? '—'}</div>
        <div style={roleBadge}><GraduationCap size={14} color="#16a34a" /> {userData?.role === 'student' ? 'Student' : 'Teacher'}</div>
        <div style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 0.5 }}>{photoUploading ? 'Uploading...' : 'Tap photo to change'}</div>
      </div>

      <div style={menuGrid}>
        {([
          { label: 'Personal Information', icon: <User size={18} color="#16a34a" />, bg: '#f0fdf4', action: () => { setEditName(userData?.fullName || ''); setEditPhone(userData?.phone || ''); setProfileError(''); setProfileSuccess(''); nav('personalInfo'); } },
          { label: 'Settings', icon: <Settings size={18} color="#16a34a" />, bg: '#f0fdf4', action: () => nav('settings') },
          { label: 'Legal', icon: <Info size={18} color="#16a34a" />, bg: '#f0fdf4', action: () => nav('legal') },
        ] as any[]).map(item => (
          <div key={item.label} style={menuCard} onClick={item.action}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
              <div style={{ ...menuIcon, background: item.bg }}>{item.icon}</div>
              <span style={{ fontSize: 15, fontWeight: 600, color: '#0f172a' }}>{item.label}</span>
            </div>
            <ChevronRight size={16} color="#94a3b8" />
          </div>
        ))}

        {userData?.role === 'student' && (
          <div style={{ ...menuCard, borderColor: '#fecaca' }} onClick={() => window.location.href = '/report-ragging'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1 }}>
              <div style={{ ...menuIcon, background: '#fef2f2' }}><TriangleAlert size={18} color="#dc2626" /></div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#dc2626' }}>Report Ragging</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>Confidential · Goes directly to HOD</div>
              </div>
            </div>
            <ChevronRight size={16} color="#dc2626" />
          </div>
        )}
      </div>

      <button onClick={onLogout} style={logoutBtn}><LogOut size={16} color="#dc2626" /> Log Out</button>
      <div style={{ textAlign: 'center', fontSize: 11, color: '#cbd5e1', letterSpacing: 1, marginTop: 8 }}>UNIFIX PLATFORM</div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 16 }}><label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 7 }}>{label}</label>{children}</div>;
}

const scrollWrap: React.CSSProperties = { overflowY: 'auto', padding: '0 20px 100px', paddingTop: 20, flex: 1 };
const subHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingTop: 4 };
const backBtn: React.CSSProperties = { width: 38, height: 38, borderRadius: 10, background: '#f8fafc', border: '1.5px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const subTitle: React.CSSProperties = { fontSize: 18, fontWeight: 800, color: '#0f172a' };
const desktopFormGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 };
const formCard: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 18, marginBottom: 16, border: '1.5px solid #f1f5f9' };
const formSectionLbl: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: 0.8, marginBottom: 16 };
const formInp: React.CSSProperties = { width: '100%', background: '#f8fafc', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: 13, fontSize: 14, color: '#0f172a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
const readOnly: React.CSSProperties = { background: '#f8fafc', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: 13, display: 'flex', alignItems: 'center', gap: 8 };
const readOnlyTag: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#94a3b8', background: '#f1f5f9', borderRadius: 5, padding: '2px 7px' };
const formErr: React.CSSProperties = { fontSize: 13, color: '#dc2626', fontWeight: 600, marginBottom: 10, textAlign: 'center' };
const formOk: React.CSSProperties = { fontSize: 13, color: '#16a34a', fontWeight: 600, marginBottom: 10, textAlign: 'center' };
const saveBtn: React.CSSProperties = { width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 4 };
const idEmpty: React.CSSProperties = { background: '#f8fafc', borderRadius: 10, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #e2e8f0', fontSize: 13, color: '#94a3b8', marginBottom: 12 };
const privacyNote: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#f8fafc', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0', fontSize: 13, color: '#64748b', marginBottom: 12 };
const pendingBadge: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fef3c7', borderRadius: 10, padding: 12, border: '1px solid #fde68a', fontSize: 13, fontWeight: 600, color: '#d97706' };
const idUploadBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#f0fdf4', borderRadius: 10, padding: '13px 0', border: '1.5px solid #bbf7d0', fontSize: 14, fontWeight: 700, color: '#16a34a', cursor: 'pointer', marginTop: 4 };
const pwWrap: React.CSSProperties = { display: 'flex', alignItems: 'center', background: '#f8fafc', borderRadius: 10, border: '1.5px solid #e2e8f0', paddingRight: 12 };
const pwInp: React.CSSProperties = { flex: 1, border: 'none', background: 'transparent', padding: 13, fontSize: 14, color: '#0f172a', outline: 'none' };
const eyeBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', padding: 6, display: 'flex', alignItems: 'center' };
const rulesBox: React.CSSProperties = { background: '#f8fafc', borderRadius: 10, padding: 14, marginBottom: 14, display: 'flex', flexDirection: 'column', gap: 8 };
const secRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 8px', background: 'none', border: 'none', width: '100%', cursor: 'pointer', textAlign: 'left' };
const profileHero: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20, paddingBottom: 28 };
const avatar: React.CSSProperties = { width: 90, height: 90, borderRadius: 45, background: '#f0fdf4', border: '2px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const cameraBtn: React.CSSProperties = { position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 9, background: '#16a34a', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const profileName: React.CSSProperties = { fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8, marginTop: 14 };
const roleBadge: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4', borderRadius: 20, padding: '6px 14px', border: '1.5px solid #bbf7d0', fontSize: 13, fontWeight: 700, color: '#16a34a', marginBottom: 8 };
const menuGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12, marginBottom: 12 };
const menuCard: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1.5px solid #f1f5f9', cursor: 'pointer' };
const menuIcon: React.CSSProperties = { width: 38, height: 38, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const logoutBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', background: '#fff', border: '1.5px solid #fecaca', borderRadius: 14, padding: '16px 0', fontSize: 15, fontWeight: 700, color: '#dc2626', cursor: 'pointer', marginBottom: 16 };