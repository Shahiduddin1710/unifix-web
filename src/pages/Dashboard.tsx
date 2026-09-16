import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, complaintsAPI, lostFoundAPI, lostReportsAPI } from '../utils/api';
import { clearAuthTokens, loadUser, saveUser, getValidAccessToken } from '../utils/auth';
import { initWebNotifications, cleanupWebNotifications } from '../utils/notifications';
import BottomNav from '../components/BottomNav';
import Toast from '../components/Toast';
import HomeSection from '../sections/HomeSection';
import ComplaintsSection from '../sections/ComplaintsSection';
import LostFoundSection from '../sections/LostFoundSection';
import ReportSection from '../sections/ReportSection';
import ProfileSection from '../sections/ProfileSection';

type Tab = 'home' | 'report' | 'lostfound' | 'complaints' | 'profile';
type LfTab = 'lostreports' | 'feed' | 'lost-history' | 'claims';

export default function Dashboard() {
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'complaints' || tab === 'lostfound' || tab === 'home' || tab === 'report' || tab === 'profile') return tab as Tab;
    return 'home';
  });
  const [userData, setUserData] = useState<any>(loadUser());
  const [complaints, setComplaints] = useState<any[]>([]);
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [lostReports, setLostReports] = useState<any[]>([]);
  const [userLostReports, setUserLostReports] = useState<any[]>([]);
  const [claimItems, setClaimItems] = useState<any[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);
  const [lfLoading, setLfLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lfActiveTab, setLfActiveTab] = useState<LfTab>('lostreports');
  const [hasPendingIdCard, setHasPendingIdCard] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [successTicketId, setSuccessTicketId] = useState<string | null>(null);

  const userId = userData?.uid || userData?.id || '';

  const fetchProfile = useCallback(async () => {
    try {
      const res = await authAPI.myProfile();
      if (res?.profile) { setUserData(res.profile); saveUser(res.profile); }
      setHasPendingIdCard(res.hasPendingIdCardRequest || false);
    } catch {}
  }, []);

  const fetchComplaints = useCallback(async (silent = false) => {
    if (!silent) setComplaintsLoading(true);
    try {
      const data = await complaintsAPI.myComplaints();
      setComplaints(data?.complaints ?? data ?? []);
    } catch {}
    finally { if (!silent) setComplaintsLoading(false); }
  }, []);

  const fetchLostFound = useCallback(async (silent = false) => {
    if (!silent) setLfLoading(true);
    try {
      const [feed, reports, claims] = await Promise.all([
        lostFoundAPI.feed(),
        lostReportsAPI.feed(),
        lostFoundAPI.claims(),
      ]);
      const feedArr: any[] = feed?.items ?? feed?.data ?? feed ?? [];
      const reportsArr: any[] = reports?.items ?? reports?.data ?? reports ?? [];
      const claimsArr: any[] = claims?.items ?? claims?.data ?? claims ?? [];
      setFeedItems(feedArr.map((item: any) => ({ ...item, isMyPost: item.postedById === userId })));
      setLostReports(reportsArr.map((item: any) => ({ ...item, isMyPost: item.postedById === userId })));
      setUserLostReports(reportsArr.filter((item: any) => item.postedById === userId).map((item: any) => ({ ...item, isMyPost: true })));
      setClaimItems(claimsArr);
    } catch {}
    finally { if (!silent) setLfLoading(false); }
  }, [userId]);
  useEffect(() => {
    (async () => {
      const token = await getValidAccessToken();
      if (!token) { nav('/login'); return; }
      await fetchProfile();
      await Promise.all([fetchComplaints(), fetchLostFound()]);
      initWebNotifications(token).catch(() => {});
    })();

    const handleForegroundNotification = (e: Event) => {
      const { title, body } = (e as CustomEvent).detail;
      setToast({ message: `${title}: ${body}`, type: 'info' });
    };
    window.addEventListener('unifix-foreground-notification', handleForegroundNotification);
    return () => window.removeEventListener('unifix-foreground-notification', handleForegroundNotification);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchComplaints(true), fetchLostFound(true)]);
    setRefreshing(false);
  }, [fetchComplaints, fetchLostFound]);

  const handleLogout = useCallback(async () => {
    try {
      const token = await getValidAccessToken();
      if (token) await cleanupWebNotifications(token);
    } catch {}
    try { await authAPI.logoutAllDevices(); } catch {}
    clearAuthTokens();
    nav('/login');
  }, [nav]);

  const firstName = (userData?.fullName?.split(' ')[0] ?? userData?.name?.split(' ')[0] ?? 'User');

  if (successTicketId) return (
    <div style={{ minHeight: '100dvh', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: 32, width: '100%', maxWidth: 380, textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: 40, background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, margin: '0 auto 20px' }}>✓</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111', marginBottom: 8 }}>Complaint Submitted!</h2>
        <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>Your complaint has been submitted successfully.</p>
        <div style={{ background: '#f0fdf4', borderRadius: 16, padding: 20, marginBottom: 24, border: '1px solid #86efac' }}>
          <div style={{ fontSize: 12, color: '#065f46', fontWeight: 600, marginBottom: 6 }}>Your Ticket ID</div>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a', letterSpacing: 1.5, marginBottom: 6 }}>{successTicketId}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Save this ID to track your complaint</div>
        </div>
        <button onClick={() => { setSuccessTicketId(null); setActiveTab('complaints'); fetchComplaints(); }} style={{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginBottom: 10 }}>Track My Complaint</button>
        <button onClick={() => { setSuccessTicketId(null); setActiveTab('home'); }} style={{ width: '100%', background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Back to Home</button>
      </div>
    </div>
  );

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <div style={outerShell}>
      {toast && <Toast message={toast.message} type={toast.type} onHide={() => setToast(null)} />}
      <div style={innerCard}>
        <SideNav active={activeTab} onChange={setActiveTab} firstName={firstName} userData={userData} />
        <div style={root}>
          <div style={content}>
            {activeTab === 'home' && (
              <div style={{ overflowY: 'auto', height: '100%' }}>
                <HomeSection firstName={firstName} complaints={complaints} loading={complaintsLoading} onViewAll={() => setActiveTab('complaints')} onRefresh={onRefresh} refreshing={refreshing} />
              </div>
            )}
            {activeTab === 'complaints' && (
              <ComplaintsSection complaints={complaints} loading={complaintsLoading} onRefresh={() => fetchComplaints()} onReportIssue={() => setActiveTab('report')} />
            )}
            {activeTab === 'lostfound' && (
              <LostFoundSection feedItems={feedItems} lostReports={lostReports} userLostReports={userLostReports} claimItems={claimItems} loading={lfLoading} activeTab={lfActiveTab} onSetTab={setLfActiveTab} onRefresh={onRefresh} userId={userId} />
            )}
            {activeTab === 'report' && (
              <div style={{ overflowY: 'auto', height: '100%' }}>
                <ReportSection onBack={() => setActiveTab('home')} onSuccess={(ticketId) => { setSuccessTicketId(ticketId); }} />
              </div>
            )}
            {activeTab === 'profile' && (
              <div style={{ overflowY: 'auto', height: '100%' }}>
                <ProfileSection userData={userData} onLogout={handleLogout} hasPendingIdCard={hasPendingIdCard} onIdCardUpdate={fetchProfile} />
              </div>
            )}
          </div>
          <BottomNav active={activeTab} onChange={setActiveTab} />
        </div>
      </div>
    </div>
  );
}

const outerShell: React.CSSProperties = { minHeight: '100dvh', background: '#f8fafc', display: 'flex', alignItems: 'stretch' };
const innerCard: React.CSSProperties = { display: 'flex', flexDirection: 'row', width: '100%', background: '#f8fafc' };
const root: React.CSSProperties = { flex: 1, height: '100dvh', display: 'flex', flexDirection: 'column', background: '#f8fafc', minWidth: 0 };
const content: React.CSSProperties = { flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' };

function SideNav({ active, onChange, firstName, userData }: { active: Tab; onChange: (t: Tab) => void; firstName: string; userData: any }) {
  const [width, setWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const [collapsed, setCollapsed] = React.useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  React.useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      setWidth(w);
      if (w < 768) setCollapsed(true);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (width < 768) return null;

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'home', label: 'Home', icon: <IconHome /> },
    { key: 'report', label: 'Report Issue', icon: <IconReport /> },
    { key: 'lostfound', label: 'Lost & Found', icon: <IconSearch /> },
    { key: 'complaints', label: 'Complaints', icon: <IconList /> },
    { key: 'profile', label: 'Profile', icon: <IconUser /> },
  ];

  return (
    <div style={{ width: collapsed ? 68 : 232, flexShrink: 0, height: '100dvh', background: '#fff', borderRight: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, boxShadow: '2px 0 10px rgba(0,0,0,0.04)', transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)', overflow: 'hidden' }}>

      <div style={{ padding: '18px 0 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: collapsed ? 0 : 16, justifyContent: collapsed ? 'center' : 'flex-start', flex: 1, overflow: 'hidden' }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, overflow: 'hidden', flexShrink: 0, marginLeft: collapsed ? 'auto' : 0, marginRight: collapsed ? 'auto' : 0 }}>
            <img src="/icon.png" alt="UniFiX" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          {!collapsed && (
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', letterSpacing: -0.3, whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, transition: 'opacity 0.15s' }}>UniFiX</span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginRight: collapsed ? 'auto' : 10, marginLeft: collapsed ? 'auto' : 0, transition: 'margin 0.2s' }}
        >
          {collapsed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          )}
        </button>
      </div>

      <nav style={{ flex: 1, padding: collapsed ? '10px 8px' : '10px 10px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', overflowX: 'hidden' }}>
        {tabs.map(t => {
          const isActive = active === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onChange(t.key)}
              title={collapsed ? t.label : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: collapsed ? '11px 0' : '10px 12px', borderRadius: 10, border: 'none', background: isActive ? '#f0fdf4' : 'transparent', cursor: 'pointer', width: '100%', justifyContent: collapsed ? 'center' : 'flex-start', transition: 'background 0.15s', position: 'relative', flexShrink: 0 }}
            >
              {isActive && (
                <div style={{ position: 'absolute', left: 0, top: '20%', height: '60%', width: 3, borderRadius: '0 3px 3px 0', background: '#16a34a' }} />
              )}
              <span style={{ color: isActive ? '#16a34a' : '#94a3b8', flexShrink: 0, display: 'flex', transition: 'color 0.15s' }}>{t.icon}</span>
              {!collapsed && (
                <span style={{ fontSize: 13.5, fontWeight: isActive ? 700 : 500, color: isActive ? '#16a34a' : '#374151', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{t.label}</span>
              )}
              {!collapsed && isActive && (
                <div style={{ width: 6, height: 6, borderRadius: 3, background: '#16a34a', flexShrink: 0 }} />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function IconHome() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IconReport() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IconSearch() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconList() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="13" y2="16"/></svg>; }
function IconUser() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }