import React from 'react';

type Tab = 'home' | 'report' | 'lostfound' | 'complaints' | 'profile';

interface Props {
  active: Tab;
  onChange: (t: Tab) => void;
}

function IconHome({ active }: { active: boolean }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>; }
function IconReport({ active }: { active: boolean }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>; }
function IconSearch({ active }: { active: boolean }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>; }
function IconList({ active }: { active: boolean }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>; }
function IconUser({ active }: { active: boolean }) { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#16a34a' : '#94a3b8'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>; }

const tabs: { key: Tab; label: string }[] = [
  { key: 'home', label: 'Home' },
  { key: 'report', label: 'Report' },
  { key: 'lostfound', label: 'Lost & Found' },
  { key: 'complaints', label: 'Complaints' },
  { key: 'profile', label: 'Profile' },
];

function TabIcon({ tabKey, active }: { tabKey: Tab; active: boolean }) {
  if (tabKey === 'home') return <IconHome active={active} />;
  if (tabKey === 'report') return <IconReport active={active} />;
  if (tabKey === 'lostfound') return <IconSearch active={active} />;
  if (tabKey === 'complaints') return <IconList active={active} />;
  return <IconUser active={active} />;
}

export default function BottomNav({ active, onChange }: Props) {
  const [width, setWidth] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 375);
  React.useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  if (width >= 768) return null;
  return (
    <nav style={nav}>
      {tabs.map(t => {
        const isActive = active === t.key;
        return (
          <button key={t.key} onClick={() => onChange(t.key)} style={navBtn}>
            <TabIcon tabKey={t.key} active={isActive} />
            <span style={{ fontSize: 9, fontWeight: isActive ? 700 : 500, color: isActive ? '#16a34a' : '#94a3b8', marginTop: 3 }}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const nav: React.CSSProperties = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  display: 'flex', backgroundColor: '#fff',
  borderTop: '1px solid #f1f5f9',
  paddingTop: 10,
  paddingBottom: 'env(safe-area-inset-bottom, 10px)',
  zIndex: 100,
  boxShadow: '0 -2px 8px rgba(0,0,0,0.04)',
};
const navBtn: React.CSSProperties = {
  flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
  background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px',
};