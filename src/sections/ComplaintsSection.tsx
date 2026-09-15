import React, { useState, useCallback } from 'react';
import { complaintsAPI } from '../utils/api';
import Modal from '../components/Modal';
import { Wrench, MapPin, Calendar, User, Phone, ClipboardList, Shield, ChevronRight } from '../components/Icons';

interface Complaint {
  id: string; ticketId: string; category: string; subIssue?: string | null; customIssue?: string | null;
  description?: string; building: string; roomDetail?: string; status: string; queueStatus?: string;
  createdAt: any; assignedToName?: string | null; assignedToPhone?: string | null; photoUrl?: string | null;
  rating?: number | null; ratingComment?: string | null; ratingDisabled?: boolean; flagResolvedBy?: string;
}
interface Props { complaints: Complaint[]; loading: boolean; onRefresh: () => void; onReportIssue: () => void; }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: 'Pending', color: '#d97706', bg: '#fef3c7', dot: '#d97706' },
  assigned: { label: 'Assigned', color: '#2563eb', bg: '#dbeafe', dot: '#2563eb' },
  in_progress: { label: 'In Progress', color: '#7c3aed', bg: '#ede9fe', dot: '#7c3aed' },
  completed: { label: 'Completed', color: '#16a34a', bg: '#dcfce7', dot: '#16a34a' },
  rejected: { label: 'Rejected', color: '#dc2626', bg: '#fef2f2', dot: '#dc2626' },
};
const STEPS = ['pending', 'assigned', 'in_progress', 'completed'];
const STEP_LABELS = ['Pending', 'Assigned', 'In Progress', 'Done'];

function formatDate(ts: any): string {
  if (!ts) return '—';
  let ms: number | null = null;
  if (typeof ts === 'number') ms = ts * 1000;
  else if (typeof ts === 'string') ms = new Date(ts).getTime();
  else if (ts?._seconds) ms = ts._seconds * 1000;
  else if (ts?.seconds) ms = ts.seconds * 1000;
  if (!ms || isNaN(ms)) return '—';
  return new Date(ms).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function Stars({ count, size = 16 }: { count: number; size?: number }) {
  return <span>{[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: size, color: s <= count ? '#f59e0b' : '#e2e8f0' }}>★</span>)}</span>;
}

function InteractiveStars({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} onClick={() => onChange(s)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 36, color: s <= value ? '#f59e0b' : '#e2e8f0' }}>★</button>
      ))}
    </div>
  );
}

export default function ComplaintsSection({ complaints, loading, onRefresh, onReportIssue }: Props) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [trackModal, setTrackModal] = useState(false);
  const [rateModal, setRateModal] = useState(false);
  const [rateTarget, setRateTarget] = useState<Complaint | null>(null);
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [rateLoading, setRateLoading] = useState(false);
  const [rateError, setRateError] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [imageModal, setImageModal] = useState<string | null>(null);

  const filtered = complaints.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'pending') return c.status === 'pending';
    if (filter === 'resolved') return c.status === 'completed' || c.status === 'rejected';
    return true;
  });

  const openTrack = useCallback(async (c: Complaint) => {
    setSelected(null); setTrackLoading(true); setTrackModal(true);
    try { const updated = await complaintsAPI.getById(c.id); setSelected(updated as any); }
    catch { setSelected(c); } finally { setTrackLoading(false); }
  }, []);

  const submitRating = useCallback(async () => {
    if (stars === 0) { setRateError('Please select a star rating.'); return; }
    if (!rateTarget) return;
    setRateLoading(true); setRateError('');
    try {
      await complaintsAPI.rate(rateTarget.id, stars, comment.trim());
      setRateModal(false); setRateTarget(null); setStars(0); setComment(''); onRefresh();
    } catch (err: any) { setRateError(err.message || 'Failed to submit rating.'); }
    finally { setRateLoading(false); }
  }, [stars, comment, rateTarget, onRefresh]);

  return (
    <div style={wrap}>
      <div style={tabHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ClipboardList size={20} color="#0f172a" />
          <div style={tabTitle}>My Complaints</div>
        </div>
      </div>
      <div style={filterRow}>
        {(['all', 'pending', 'resolved'] as const).map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ ...chip, ...(filter === t ? chipActive : {}) }}>
            <span style={{ fontSize: 13, fontWeight: filter === t ? 700 : 600, color: filter === t ? '#16a34a' : '#64748b' }}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          </button>
        ))}
      </div>
      <div style={list}>
        {loading && filtered.length === 0 ? (
          [1,2,3].map(i => <div key={i} style={skelCard}><div style={skelBar} /><div style={{ ...skelBar, width: '60%', marginTop: 10 }} /></div>)
        ) : filtered.length === 0 ? (
          <div style={empty}>
            <div style={emptyIconWrap}><ClipboardList size={40} color="#cbd5e1" /></div>
            <div style={emptyTitle}>No complaints found</div>
            <button onClick={onReportIssue} style={reportBtn}>Report an Issue</button>
          </div>
        ) : (
          <div style={grid}>
            {filtered.map(c => {
              const sm = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
              const issue = c.subIssue || c.customIssue || 'Issue reported';
              const isCompleted = c.status === 'completed';
              const hasRating = c.rating != null;
              const ratingDisabled = c.ratingDisabled || c.flagResolvedBy === 'admin';
              const isAssigned = c.status === 'assigned' || c.status === 'in_progress';
              return (
                <div key={c.id} style={card}>
                  <div style={cardTop}>
                    <div style={catIcon}><Wrench size={18} color="#16a34a" /></div>
                    <div style={{ flex: 1 }}>
                      <div style={cardTitle}>{issue}</div>
                      <div style={cardMeta}><MapPin size={12} color="#94a3b8" /> {c.building}</div>
                      {c.roomDetail && <div style={cardMeta}>{c.roomDetail.includes(',') ? c.roomDetail.split(',').slice(1).join(',').trim() : c.roomDetail}</div>}
                      <div style={{ ...cardMeta, display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12} color="#94a3b8" /> {formatDate(c.createdAt)}</div>
                      {c.status === 'pending' && c.queueStatus === 'waiting_for_staff' && (
                        <div style={queueBadge}>Waiting for staff assignment</div>
                      )}
                    </div>
                    {c.photoUrl && (
                      <img src={c.photoUrl} alt="complaint" style={{ width: 72, height: 72, borderRadius: 10, objectFit: 'cover', cursor: 'pointer', flexShrink: 0 }} onClick={() => setImageModal(c.photoUrl!)} />
                    )}
                  </div>
                  {isAssigned && c.assignedToName && (
                    <div style={staffBanner}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={staffIcon}><User size={14} color="#2563eb" /></div>
                        <div>
                          <div style={staffLabel}>Assigned Staff</div>
                          <div style={staffName}>{c.assignedToName}</div>
                        </div>
                      </div>
                      {c.assignedToPhone && (
                        <a href={`tel:${c.assignedToPhone}`} style={callBtn}><Phone size={16} color="#fff" /></a>
                      )}
                    </div>
                  )}
                  {isCompleted && c.flagResolvedBy === 'admin' && (
                    <div style={adminBadge}><Shield size={12} color="#7c3aed" /> Resolved by Admin</div>
                  )}
                  {isCompleted && hasRating && c.flagResolvedBy !== 'admin' && (
                    <div style={ratingRow}><Stars count={c.rating!} /> <span style={{ fontSize: 12, color: '#64748b' }}>You rated {c.rating}/5</span></div>
                  )}
                  <div style={cardBottom}>
                    <div style={{ ...statusBadge, background: sm.bg }}>
                      <div style={{ ...statusDot, background: sm.dot }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: sm.color }}>{sm.label}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {isCompleted && !hasRating && !ratingDisabled && (
                        <button onClick={() => { setRateTarget(c); setStars(0); setComment(''); setRateError(''); setRateModal(true); }} style={rateBtn}>
                          <Star size={12} /> Rate
                        </button>
                      )}
                      <button onClick={() => openTrack(c)} style={trackBtn}>Track <ChevronRight size={14} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {imageModal && (
        <div style={imgOverlay} onClick={() => setImageModal(null)}>
          <img src={imageModal} alt="full" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }} />
        </div>
      )}

      <Modal visible={trackModal} onClose={() => { setTrackModal(false); setSelected(null); }} title="Track Complaint">
        {trackLoading ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Fetching latest status...</div>
        ) : selected && (() => {
          const sm = STATUS_CONFIG[selected.status] || STATUS_CONFIG.pending;
          const idx = STEPS.indexOf(selected.status);
          const isRejected = selected.status === 'rejected';
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f0fdf4', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Wrench size={22} color="#16a34a" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{selected.subIssue || selected.customIssue || 'Issue reported'}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 2, textTransform: 'capitalize' }}>{selected.category}</div>
                </div>
                <div style={{ ...statusBadge, background: sm.bg, padding: '5px 10px' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: sm.color }}>{sm.label}</span>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                {[['Ticket ID', selected.ticketId], ['Location', [selected.building, selected.roomDetail].filter(Boolean).join(', ')], ['Submitted', formatDate(selected.createdAt)]].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: k === 'Ticket ID' ? '#16a34a' : '#0f172a', maxWidth: '60%', textAlign: 'right' }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
                {STEPS.map((step, i) => {
                  const active = i <= idx && !isRejected;
                  return (
                    <React.Fragment key={step}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                        <div style={{ width: 14, height: 14, borderRadius: 7, background: active ? '#16a34a' : '#e2e8f0', border: `2px solid ${active ? '#16a34a' : '#e2e8f0'}` }} />
                        <span style={{ fontSize: 10, fontWeight: active ? 700 : 600, color: active ? '#16a34a' : '#94a3b8', textAlign: 'center', width: 50 }}>{STEP_LABELS[i]}</span>
                      </div>
                      {i < 3 && <div style={{ flex: 1, height: 2, background: i < idx && !isRejected ? '#16a34a' : '#e2e8f0', marginBottom: 20 }} />}
                    </React.Fragment>
                  );
                })}
              </div>
              {selected.assignedToName && (
                <div style={{ ...staffBanner, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={staffIcon}><User size={14} color="#2563eb" /></div>
                    <div><div style={staffLabel}>Assigned Staff</div><div style={staffName}>{selected.assignedToName}</div></div>
                  </div>
                  {selected.assignedToPhone && <a href={`tel:${selected.assignedToPhone}`} style={callBtn}><Phone size={16} color="#fff" /></a>}
                </div>
              )}
              <button onClick={() => setTrackModal(false)} style={closeBtn}>Close</button>
            </>
          );
        })()}
      </Modal>

      <Modal visible={rateModal} onClose={() => setRateModal(false)} title="Rate Service">
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>How satisfied are you with how this complaint was handled?</p>
        <InteractiveStars value={stars} onChange={setStars} />
        <textarea style={{ width: '100%', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 12, fontSize: 14, minHeight: 80, marginTop: 20, resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          placeholder="Add a comment (optional)" value={comment} onChange={e => setComment(e.target.value)} />
        {rateError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{rateError}</div>}
        <button onClick={submitRating} disabled={rateLoading} style={{ ...closeBtn, marginTop: 16 }}>{rateLoading ? 'Submitting...' : 'Submit Rating'}</button>
      </Modal>
    </div>
  );
}

function Star({ size = 12 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="#f59e0b" stroke="#f59e0b" strokeWidth="1"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>;
}

const wrap: React.CSSProperties = { flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const tabHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderBottom: '1px solid #f1f5f9', flexShrink: 0 };
const tabTitle: React.CSSProperties = { fontSize: 17, fontWeight: 800, color: '#0f172a' };
const filterRow: React.CSSProperties = { display: 'flex', padding: '12px 16px', gap: 8, background: '#fff', borderBottom: '1px solid #f1f5f9', flexShrink: 0 };
const chip: React.CSSProperties = { padding: '7px 16px', borderRadius: 20, background: '#f8fafc', border: '1.5px solid #e2e8f0', cursor: 'pointer' };
const chipActive: React.CSSProperties = { background: '#f0fdf4', borderColor: '#16a34a' };
const list: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 80 };
const grid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 };
const skelCard: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 18, border: '1.5px solid #f1f5f9' };
const skelBar: React.CSSProperties = { height: 12, width: '100%', background: '#f1f5f9', borderRadius: 6 };
const empty: React.CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60 };
const emptyIconWrap: React.CSSProperties = { marginBottom: 12 };
const emptyTitle: React.CSSProperties = { fontSize: 17, fontWeight: 700, color: '#374151', marginBottom: 16 };
const reportBtn: React.CSSProperties = { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const card: React.CSSProperties = { background: '#fff', borderRadius: 14, padding: 16, border: '1.5px solid #f1f5f9' };
const cardTop: React.CSSProperties = { display: 'flex', gap: 12, marginBottom: 14 };
const catIcon: React.CSSProperties = { width: 40, height: 40, borderRadius: 10, background: '#f0fdf4', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const cardTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#0f172a', marginBottom: 6, lineHeight: 1.4 };
const cardMeta: React.CSSProperties = { fontSize: 12, color: '#64748b', marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 };
const queueBadge: React.CSSProperties = { background: '#ede9fe', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#7c3aed', fontWeight: 600, marginTop: 4, display: 'inline-block' };
const staffBanner: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#eff6ff', borderRadius: 10, padding: '10px 12px', marginBottom: 12, border: '1px solid #bfdbfe' };
const staffIcon: React.CSSProperties = { width: 32, height: 32, borderRadius: 16, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const staffLabel: React.CSSProperties = { fontSize: 11, color: '#64748b', fontWeight: 600 };
const staffName: React.CSSProperties = { fontSize: 13, color: '#1e40af', fontWeight: 700 };
const callBtn: React.CSSProperties = { width: 36, height: 36, borderRadius: 18, background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' };
const adminBadge: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f3e8ff', borderRadius: 8, padding: '5px 10px', fontSize: 12, fontWeight: 700, color: '#7c3aed', marginBottom: 8 };
const ratingRow: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px', marginBottom: 4 };
const cardBottom: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 12 };
const statusBadge: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, borderRadius: 8, padding: '5px 10px' };
const statusDot: React.CSSProperties = { width: 6, height: 6, borderRadius: 3 };
const rateBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 700, color: '#d97706', cursor: 'pointer' };
const trackBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 2, background: 'none', border: 'none', fontSize: 13, color: '#16a34a', fontWeight: 600, cursor: 'pointer' };
const imgOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, cursor: 'pointer' };
const closeBtn: React.CSSProperties = { width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 14, padding: '16px 0', fontSize: 16, fontWeight: 700, cursor: 'pointer', marginTop: 8 };