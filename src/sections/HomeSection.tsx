import React from 'react';

interface Complaint {
  id: string;
  subIssue?: string | null;
  customIssue?: string | null;
  building?: string;
  status?: string;
  createdAt?: any;
}

interface Props {
  firstName: string;
  complaints: Complaint[];
  loading: boolean;
  onViewAll: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: '#d97706', bg: '#fef3c7' },
  assigned: { label: 'Assigned', color: '#2563eb', bg: '#dbeafe' },
  in_progress: { label: 'In Progress', color: '#7c3aed', bg: '#ede9fe' },
  completed: { label: 'Completed', color: '#16a34a', bg: '#dcfce7' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2' },
};

function formatAgo(ts: any): string {
  if (!ts) return '';
  let sec: number | null = null;
  if (typeof ts === 'number') sec = ts;
  else if (ts?._seconds) sec = ts._seconds;
  else if (ts?.seconds) sec = ts.seconds;
  else if (typeof ts === 'string') sec = Math.floor(new Date(ts).getTime() / 1000);
  if (!sec) return '';
  const diff = Math.floor(Date.now() / 1000 - sec);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function HomeSection({ firstName, complaints, loading, onViewAll, onRefresh, refreshing }: Props) {
  const recent = complaints.slice(0, 3);
  return (
    <div style={wrap}>
      <div style={greetRow}>
        <div style={greetName}>Hello, {firstName}</div>
        <div style={greetSub}>Welcome back to your campus dashboard</div>
      </div>
      <div style={sectionRow}>
        <div style={sectionTitle}>Recent Activity</div>
        {complaints.length > 0 && <button onClick={onViewAll} style={seeAll}>View All</button>}
      </div>
      {loading && recent.length === 0 ? (
        [1, 2].map(i => (
          <div key={i} style={skeleton}>
            <div style={skelBar} />
            <div style={{ ...skelBar, width: '60%', marginTop: 10 }} />
          </div>
        ))
      ) : recent.length === 0 ? (
        <div style={empty}>
          <div style={emptyIcon}>📋</div>
          <div style={emptyTitle}>No recent activity</div>
          <div style={emptySub}>Use the tabs below to report issues or check lost items</div>
        </div>
      ) : recent.map(c => {
        const sm = STATUS_CONFIG[c.status || 'pending'] || STATUS_CONFIG.pending;
        const issue = c.subIssue || c.customIssue || 'Issue reported';
        return (
          <div key={c.id} style={actCard} onClick={onViewAll}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={actIcon}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg></div>
              <div style={{ flex: 1 }}>
                <div style={actTitle}>{issue}</div>
                <div style={actMeta}>{c.building} • {formatAgo(c.createdAt)}</div>
              </div>
            </div>
            <div style={{ ...statusPill, background: sm.bg, color: sm.color }}>{sm.label}</div>
          </div>
        );
      })}
    </div>
  );
}

const wrap: React.CSSProperties = { padding: '20px 20px 100px' };
const greetRow: React.CSSProperties = { marginBottom: 24 };
const greetName: React.CSSProperties = { fontSize: 26, fontWeight: 800, color: '#0f172a', letterSpacing: -0.5 };
const greetSub: React.CSSProperties = { fontSize: 14, color: '#64748b', marginTop: 4 };
const sectionRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 };
const sectionTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#0f172a' };
const seeAll: React.CSSProperties = { background: 'none', border: 'none', color: '#16a34a', fontSize: 13, fontWeight: 600, cursor: 'pointer' };
const skeleton: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 18, border: '1.5px solid #f1f5f9', marginBottom: 8 };
const skelBar: React.CSSProperties = { height: 12, width: '100%', background: '#f1f5f9', borderRadius: 6 };
const empty: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 };
const emptyIcon: React.CSSProperties = { marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const emptyTitle: React.CSSProperties = { fontSize: 17, fontWeight: 700, color: '#374151', marginBottom: 6 };
const emptySub: React.CSSProperties = { fontSize: 13, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 };
const actCard: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, border: '1.5px solid #f1f5f9', cursor: 'pointer' };
const actIcon: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const actTitle: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#0f172a' };
const actMeta: React.CSSProperties = { fontSize: 12, color: '#94a3b8', marginTop: 2 };
const statusPill: React.CSSProperties = { borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, marginLeft: 8, whiteSpace: 'nowrap' };