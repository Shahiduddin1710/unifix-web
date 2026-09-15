import React, { useState, useCallback } from 'react';
import { lostFoundAPI, lostReportsAPI } from '../utils/api';
import { uploadToCloudinary } from '../utils/cloudinary';
import Modal from '../components/Modal';
import { Search, Package, MapPin, Calendar, Phone, Plus, CheckCircle, X } from '../components/Icons';

type LfTab = 'lostreports' | 'feed' | 'lost-history' | 'claims';
interface LostItem { id: string; itemName: string; category: string; description?: string; roomNumber: string; roomLabel?: string; collectLocation?: string; photoUrl?: string | null; postedByName: string; createdAt: any; status: string; isMyPost: boolean; handedToName?: string; }
interface LostReport { id: string; itemName: string; category: string; description: string; locationLost: string; dateLost: string; howToReach: string; images: string[]; postedByName?: string; postedBy?: { name?: string; role?: string }; postedAt: any; status: string; isMyPost: boolean; }
interface ClaimItem { id: string; itemName: string; photoUrl?: string | null; handedByName: string; handedByRole?: string; handedToName: string; roomNumber?: string; roomLabel?: string; collectLocation?: string; handedAt: any; }
interface Props { feedItems: LostItem[]; lostReports: LostReport[]; userLostReports: LostReport[]; claimItems: ClaimItem[]; loading: boolean; activeTab: LfTab; onSetTab: (t: LfTab) => void; onRefresh: () => void; userId: string; }

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
function formatDate(ts: any): string {
  if (!ts) return '—';
  let ms: number | null = null;
  if (typeof ts === 'number') ms = ts * 1000;
  else if (typeof ts === 'string') ms = new Date(ts).getTime();
  else if (ts?._seconds) ms = ts._seconds * 1000;
  else if (ts?.seconds) ms = ts.seconds * 1000;
  if (!ms || isNaN(ms)) return '—';
  return new Date(ms).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function isValidDate(d: string): boolean {
  const p = d.trim().split('/');
  if (p.length !== 3) return false;
  const [day, month, year] = p.map(Number);
  if (!day || !month || !year || day < 1 || day > 31 || month < 1 || month > 12) return false;
  const dt = new Date(year, month - 1, day);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (dt > today) return false;
  const limit = new Date(today); limit.setDate(limit.getDate() - 14);
  return dt >= limit;
}

export default function LostFoundSection({ feedItems, lostReports, userLostReports, claimItems, loading, activeTab, onSetTab, onRefresh, userId }: Props) {
  const [handoverItem, setHandoverItem] = useState<LostItem | null>(null);
  const [handedTo, setHandedTo] = useState('');
  const [handoverLoading, setHandoverLoading] = useState(false);
  const [handoverError, setHandoverError] = useState('');
  const [showPostSheet, setShowPostSheet] = useState(false);
  const [showFoundModal, setShowFoundModal] = useState(false);
  const [showLostModal, setShowLostModal] = useState(false);
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [fName, setFName] = useState(''); const [fCat, setFCat] = useState('Others'); const [fDesc, setFDesc] = useState(''); const [fRoom, setFRoom] = useState(''); const [fCollect, setFCollect] = useState(''); const [fPhoto, setFPhoto] = useState<File | null>(null); const [fSubmitting, setFSubmitting] = useState(false); const [fError, setFError] = useState('');
  const [lName, setLName] = useState(''); const [lCat, setLCat] = useState('Other'); const [lDesc, setLDesc] = useState(''); const [lRoom, setLRoom] = useState(''); const [lDate, setLDate] = useState(''); const [lDateErr, setLDateErr] = useState(''); const [lReach, setLReach] = useState(''); const [lPhoto, setLPhoto] = useState<File | null>(null); const [lSubmitting, setLSubmitting] = useState(false); const [lError, setLError] = useState('');

  const handleDateInput = (val: string) => {
    let d = val.replace(/\D/g, '').slice(0, 8);
    let f = d.slice(0, 2);
    if (d.length > 2) f += '/' + d.slice(2, 4);
    if (d.length > 4) f += '/' + d.slice(4, 8);
    setLDate(f);
    setLDateErr(f.length === 10 && !isValidDate(f) ? 'Date must be within last 14 days.' : '');
  };

  const handleHandover = useCallback(async () => {
    if (!handedTo.trim()) { setHandoverError('Please enter the name.'); return; }
    if (!handoverItem) return;
    setHandoverLoading(true);
    try { await lostFoundAPI.handover(handoverItem.id, handedTo.trim()); setHandoverItem(null); onRefresh(); }
    catch (err: any) { setHandoverError(err.message || 'Failed.'); }
    finally { setHandoverLoading(false); }
  }, [handedTo, handoverItem, onRefresh]);

  const submitFound = async () => {
    setFError('');
    if (!fName.trim()) return setFError('Please enter the item name.');
    if (!fRoom.trim()) return setFError('Please enter the room number.');
    if (!fCollect.trim()) return setFError('Please mention where to collect the item.');
    setFSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (fPhoto) photoUrl = await uploadToCloudinary(fPhoto, 'lostFound');
      await lostFoundAPI.postItem({ itemName: fName.trim(), category: fCat, description: fDesc.trim(), roomNumber: fRoom.trim(), roomLabel: '', collectLocation: fCollect.trim(), photoUrl });
      setShowFoundModal(false); setFName(''); setFCat('Others'); setFDesc(''); setFRoom(''); setFCollect(''); setFPhoto(null);
      onSetTab('feed'); onRefresh();
    } catch (err: any) { setFError(err.message || 'Failed to post.'); }
    finally { setFSubmitting(false); }
  };

  const submitLost = async () => {
    setLError('');
    if (!lName.trim()) return setLError('Please enter the item name.');
    if (!lDesc.trim()) return setLError('Please describe the item.');
    if (!lRoom.trim()) return setLError('Please enter the location.');
    if (!lDate.trim() || !isValidDate(lDate)) return setLError('Please enter a valid date (within last 14 days).');
    if (!lReach.trim()) return setLError('Please mention how to reach you.');
    setLSubmitting(true);
    try {
      let imageUrl: string | null = null;
      if (lPhoto) imageUrl = await uploadToCloudinary(lPhoto, 'lostReports');
      await lostReportsAPI.post({ itemName: lName.trim(), category: lCat, description: lDesc.trim(), locationLost: lRoom.trim(), dateLost: lDate.trim(), howToReach: lReach.trim(), images: imageUrl ? [imageUrl] : [] });
      setShowLostModal(false); setLName(''); setLCat('Other'); setLDesc(''); setLRoom(''); setLDate(''); setLReach(''); setLPhoto(null);
      onSetTab('lostreports'); onRefresh();
    } catch (err: any) { setLError(err.message || 'Failed to post.'); }
    finally { setLSubmitting(false); }
  };

  const markFound = async (id: string) => { try { await lostReportsAPI.markFound(id); onRefresh(); } catch {} };
  const deleteReport = async (id: string) => { if (!window.confirm('Delete this report?')) return; try { await lostReportsAPI.deleteReport(id); onRefresh(); } catch {} };

  const LFCard = ({ item }: { item: LostReport }) => (
    <div style={lfCard}>
      <div style={lfCardHeader}>
        <div style={lfAvatar}><span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>{(item.postedBy?.name || item.postedByName || '?')[0].toUpperCase()}</span></div>
        <div style={{ flex: 1 }}>
          <div style={lfPoster}>{item.postedBy?.name || item.postedByName}</div>
          <div style={lfTime}>{item.postedBy?.role ?? ''} · {formatAgo(item.postedAt)}</div>
        </div>
        {item.isMyPost && <span style={myBadge}>MY POST</span>}
        <span style={{ ...statusBadgeSm, background: item.status === 'found' ? '#2563eb' : '#16a34a' }}>{item.status === 'found' ? 'FOUND' : 'LOST'}</span>
      </div>
      {item.images?.length > 0 ? <img src={item.images[0]} alt="item" style={lfImg} onClick={() => setImageModal(item.images[0])} /> : <div style={lfImgEmpty}><Search size={36} color="#cbd5e1" /></div>}
      <div style={lfBody}>
        <div style={lfTitle}>{item.itemName}</div>
        <span style={catBadge}>{item.category}</span>
        {item.description && <div style={lfDesc}>{item.description}</div>}
        <div style={lfMeta}><MapPin size={12} color="#64748b" /> {item.locationLost}</div>
        <div style={lfMeta}><Calendar size={12} color="#64748b" /> Lost: {item.dateLost}</div>
        <div style={{ ...lfMeta, color: '#16a34a' }}><Phone size={12} color="#16a34a" /> {item.howToReach}</div>
        {item.isMyPost && (
          <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
            {item.status !== 'found' && <button onClick={() => markFound(item.id)} style={{ ...actionBtn, flex: 1 }}>Mark as Found</button>}
            <button onClick={() => deleteReport(item.id)} style={{ ...actionBtn, flex: 1, background: '#dc2626' }}>Delete</button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={wrap}>
      <div style={tabHeader}>
        <div style={{ width: 36 }} />
        <div style={tabTitle}>Lost & Found</div>
        <button onClick={() => setShowPostSheet(true)} style={addBtn}><Plus size={20} color="#fff" /></button>
      </div>
      <div style={segmentWrap}>
        <div style={segmentRow}>
          {(['lostreports', 'feed', 'lost-history', 'claims'] as LfTab[]).map(t => (
            <button key={t} onClick={() => onSetTab(t)} style={{ ...segBtn, ...(activeTab === t ? segBtnActive : {}) }}>
              <span style={{ fontSize: 13, fontWeight: activeTab === t ? 700 : 600, color: activeTab === t ? '#0f172a' : '#94a3b8' }}>
                {t === 'lostreports' ? 'Lost' : t === 'feed' ? 'Found' : t === 'lost-history' ? 'History' : 'Claims'}
              </span>
            </button>
          ))}
        </div>
      </div>
      <div style={list}>
        <div style={cardGrid}>
          {activeTab === 'lostreports' && (
            userLostReports.length === 0 ? (
              <div style={empty}>
                <Package size={40} color="#cbd5e1" />
                <div style={emptyTitle}>You haven't reported any lost items</div>
                <button onClick={() => setShowLostModal(true)} style={addItemBtn}>Post Lost Report</button>
              </div>
            ) : (<>
              {userLostReports.map(item => <LFCard key={item.id} item={item} />)}
              <button onClick={() => setShowLostModal(true)} style={{ ...addItemBtn, gridColumn: '1 / -1' }}>+ Post Lost Report</button>
            </>)
          )}
          {activeTab === 'lost-history' && (
            lostReports.length === 0 ? (
              <div style={empty}><Search size={40} color="#cbd5e1" /><div style={emptyTitle}>No lost reports yet</div></div>
            ) : lostReports.map(item => <LFCard key={item.id} item={item} />)
          )}
          {activeTab === 'feed' && (
            feedItems.length === 0 ? (
              <div style={empty}>
                <Search size={40} color="#cbd5e1" />
                <div style={emptyTitle}>No found items posted yet</div>
                <button onClick={() => setShowFoundModal(true)} style={addItemBtn}>Post Found Item</button>
              </div>
            ) : feedItems.map(item => {
              const handed = item.status === 'handed_over';
              return (
                <div key={item.id} style={lfCard}>
                  <div style={lfCardHeader}>
                    <div style={lfAvatar}><span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>{(item.postedByName || '?')[0].toUpperCase()}</span></div>
                    <div style={{ flex: 1 }}>
                      <div style={lfPoster}>{item.postedByName}</div>
                      <div style={lfTime}>{formatAgo(item.createdAt)}</div>
                    </div>
                    {item.isMyPost && <span style={myBadge}>MY POST</span>}
                    {!handed && <span style={{ ...statusBadgeSm, background: '#16a34a' }}>FOUND</span>}
                  </div>
                  {item.photoUrl ? <img src={item.photoUrl} alt="item" style={lfImg} onClick={() => setImageModal(item.photoUrl!)} /> : <div style={lfImgEmpty}><Package size={36} color="#cbd5e1" /></div>}
                  <div style={lfBody}>
                    <div style={lfTitle}>{item.itemName}</div>
                    {item.description && <div style={lfDesc}>{item.description}</div>}
                    <div style={lfMeta}><MapPin size={12} color="#64748b" /> Room {item.roomNumber}{item.roomLabel ? `, ${item.roomLabel}` : ''}</div>
                    {item.collectLocation && <div style={{ ...lfMeta, color: '#16a34a' }}>Collect from: {item.collectLocation}</div>}
                    {handed ? (
                      <div style={handedBox}><CheckCircle size={16} color="#16a34a" /> Handed to {item.handedToName}</div>
                    ) : item.isMyPost ? (
                      <button onClick={() => { setHandoverItem(item); setHandedTo(''); setHandoverError(''); }} style={{ ...actionBtn, marginTop: 10 }}>Mark as Handed Over</button>
                    ) : null}
                  </div>
                </div>
              );
            })
          )}
          {activeTab === 'claims' && (
            claimItems.length === 0 ? (
              <div style={empty}><CheckCircle size={40} color="#cbd5e1" /><div style={emptyTitle}>No claims yet</div><div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>Handover records will appear here.</div></div>
            ) : claimItems.map(item => (
              <div key={item.id} style={{ ...lfCard, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 }}>
                <div style={{ ...lfAvatar, width: 42, height: 42, borderRadius: 12, flexShrink: 0 }}><CheckCircle size={20} color="#16a34a" /></div>
                <div style={{ flex: 1 }}>
                  <div style={lfTitle}>{item.itemName}</div>
                  <div style={lfDesc}><span style={{ color: '#94a3b8' }}>Handed by </span><strong>{item.handedByName}</strong>{item.handedByRole ? ` (${item.handedByRole})` : ''}</div>
                  <div style={lfDesc}><span style={{ color: '#94a3b8' }}>Collected by </span><strong>{item.handedToName}</strong></div>
                  {item.roomNumber && <div style={lfMeta}><MapPin size={12} color="#64748b" /> Room {item.roomNumber}{item.roomLabel ? `, ${item.roomLabel}` : ''}</div>}
                  {item.collectLocation && <div style={{ ...lfMeta, color: '#16a34a' }}>{item.collectLocation}</div>}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{formatDate(item.handedAt)}</div>
                </div>
                {item.photoUrl && <img src={item.photoUrl} alt="item" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', cursor: 'pointer' }} onClick={() => setImageModal(item.photoUrl!)} />}
              </div>
            ))
          )}
        </div>
      </div>

      {imageModal && <div style={imgOverlay} onClick={() => setImageModal(null)}><img src={imageModal} alt="full" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12 }} /></div>}

      <Modal visible={!!handoverItem} onClose={() => setHandoverItem(null)} title="Mark as Handed Over">
        <input style={textInp} placeholder="Recipient's name" value={handedTo} onChange={e => { setHandedTo(e.target.value); setHandoverError(''); }} />
        {handoverError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{handoverError}</div>}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button onClick={() => setHandoverItem(null)} style={cancelBtn}>Cancel</button>
          <button onClick={handleHandover} disabled={handoverLoading} style={{ ...actionBtn, flex: 1 }}>{handoverLoading ? 'Saving...' : 'Confirm'}</button>
        </div>
      </Modal>

      <Modal visible={showPostSheet} onClose={() => setShowPostSheet(false)}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>What would you like to post?</div>
        </div>
        <button onClick={() => { setShowPostSheet(false); setShowFoundModal(true); }} style={{ ...sheetOption, background: '#f0fdf4', border: '1.5px solid #bbf7d0' }}>
          <div style={{ ...optIcon, background: '#16a34a' }}><Package size={22} color="#fff" /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, color: '#0f172a' }}>Post Found Item</div><div style={{ fontSize: 12, color: '#64748b' }}>I found something on campus</div></div>
        </button>
        <button onClick={() => { setShowPostSheet(false); setShowLostModal(true); }} style={{ ...sheetOption, background: '#fff7ed', border: '1.5px solid #fed7aa' }}>
          <div style={{ ...optIcon, background: '#f97316' }}><Search size={22} color="#fff" /></div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700, color: '#0f172a' }}>Post Lost Report</div><div style={{ fontSize: 12, color: '#64748b' }}>I lost something on campus</div></div>
        </button>
      </Modal>

      <Modal visible={showFoundModal} onClose={() => setShowFoundModal(false)} title="Post Found Item">
        <label style={lbl}>Item Name</label><input style={textInp} placeholder="e.g. Black Leather Wallet" value={fName} onChange={e => setFName(e.target.value)} />
        <label style={lbl}>Description</label><textarea style={{ ...textInp, height: 80, resize: 'none' } as any} placeholder="Describe color, brand..." value={fDesc} onChange={e => setFDesc(e.target.value)} />
        <label style={lbl}>Room Number (where found)</label><input style={textInp} placeholder="e.g. 319" value={fRoom} onChange={e => setFRoom(e.target.value)} />
        <label style={lbl}>Where to Collect</label><textarea style={{ ...textInp, height: 60, resize: 'none' } as any} placeholder="e.g. Room 214 after 2PM" value={fCollect} onChange={e => setFCollect(e.target.value)} />
        <label style={lbl}>Photo (optional)</label><input type="file" accept="image/*" onChange={e => setFPhoto(e.target.files?.[0] ?? null)} />
        {fError && <div style={errBox}>{fError}</div>}
        <button onClick={submitFound} disabled={fSubmitting} style={{ ...actionBtn, width: '100%', marginTop: 20 }}>{fSubmitting ? 'Publishing...' : 'Submit Found Item'}</button>
      </Modal>

      <Modal visible={showLostModal} onClose={() => setShowLostModal(false)} title="Post Lost Report">
        <label style={lbl}>Item Name</label><input style={textInp} placeholder="e.g. Black iPhone 14" value={lName} onChange={e => setLName(e.target.value)} />
        <label style={lbl}>Description</label><textarea style={{ ...textInp, height: 80, resize: 'none' } as any} placeholder="Color, brand, unique marks..." value={lDesc} onChange={e => setLDesc(e.target.value)} />
        <label style={lbl}>Location Lost</label><input style={textInp} placeholder="e.g. Room 319 or Canteen" value={lRoom} onChange={e => setLRoom(e.target.value)} />
        <label style={lbl}>Date Lost (DD/MM/YYYY)</label>
        <input style={{ ...textInp, borderColor: lDateErr ? '#dc2626' : '#e2e8f0' }} placeholder="DD/MM/YYYY" value={lDate} onChange={e => handleDateInput(e.target.value)} inputMode="numeric" maxLength={10} />
        {lDateErr && <div style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{lDateErr}</div>}
        <label style={lbl}>How to Reach You</label><textarea style={{ ...textInp, height: 60, resize: 'none' } as any} placeholder="e.g. Call 9876543210" value={lReach} onChange={e => setLReach(e.target.value)} />
        <label style={lbl}>Photo (optional)</label><input type="file" accept="image/*" onChange={e => setLPhoto(e.target.files?.[0] ?? null)} />
        {lError && <div style={errBox}>{lError}</div>}
        <button onClick={submitLost} disabled={lSubmitting} style={{ ...actionBtn, width: '100%', marginTop: 20 }}>{lSubmitting ? 'Publishing...' : 'Post Lost Report'}</button>
      </Modal>
    </div>
  );
}

const wrap: React.CSSProperties = { flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const tabHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#fff', borderBottom: '1px solid #f1f5f9', flexShrink: 0 };
const tabTitle: React.CSSProperties = { fontSize: 17, fontWeight: 800, color: '#0f172a', flex: 1, textAlign: 'center' };
const addBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 10, background: '#16a34a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const segmentWrap: React.CSSProperties = { padding: '12px 16px', background: '#fff', borderBottom: '1px solid #f1f5f9', flexShrink: 0 };
const segmentRow: React.CSSProperties = { display: 'flex', background: '#f8fafc', borderRadius: 10, padding: 3, border: '1.5px solid #e2e8f0', maxWidth: 480 };
const segBtn: React.CSSProperties = { flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer' };
const segBtnActive: React.CSSProperties = { background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' };
const list: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: 16, paddingBottom: 80 };
const cardGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 };
const empty: React.CSSProperties = { gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 12 };
const emptyTitle: React.CSSProperties = { fontSize: 17, fontWeight: 700, color: '#374151' };
const addItemBtn: React.CSSProperties = { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const lfCard: React.CSSProperties = { background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #f1f5f9', display: 'flex', flexDirection: 'column' };
const lfCardHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', padding: 14, gap: 10 };
const lfAvatar: React.CSSProperties = { width: 36, height: 36, borderRadius: 10, background: '#f0fdf4', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const lfPoster: React.CSSProperties = { fontSize: 14, fontWeight: 600, color: '#0f172a' };
const lfTime: React.CSSProperties = { fontSize: 11, color: '#94a3b8', marginTop: 1 };
const myBadge: React.CSSProperties = { background: '#f0fdf4', borderRadius: 6, padding: '3px 7px', fontSize: 9, fontWeight: 700, color: '#16a34a', border: '1px solid #bbf7d0', marginLeft: 6 };
const statusBadgeSm: React.CSSProperties = { borderRadius: 6, padding: '3px 8px', fontSize: 9, fontWeight: 700, color: '#fff', marginLeft: 6 };
const lfImg: React.CSSProperties = { width: '100%', height: 200, objectFit: 'cover', cursor: 'pointer' };
const lfImgEmpty: React.CSSProperties = { width: '100%', height: 120, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const lfBody: React.CSSProperties = { padding: 14 };
const lfTitle: React.CSSProperties = { fontSize: 17, fontWeight: 700, color: '#0f172a', marginBottom: 6 };
const catBadge: React.CSSProperties = { background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 6, padding: '3px 7px', fontSize: 10, fontWeight: 700, color: '#92400e', display: 'inline-block', marginBottom: 8 };
const lfDesc: React.CSSProperties = { fontSize: 13, color: '#64748b', lineHeight: 1.5, marginBottom: 8 };
const lfMeta: React.CSSProperties = { fontSize: 13, color: '#374151', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 4 };
const actionBtn: React.CSSProperties = { background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const handedBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: '#f0fdf4', borderRadius: 10, padding: 12, marginTop: 10, border: '1px solid #bbf7d0', fontSize: 13, fontWeight: 600, color: '#16a34a' };
const imgOverlay: React.CSSProperties = { position: 'fixed', inset: 0, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, cursor: 'pointer' };
const sheetOption: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 14, borderRadius: 14, padding: 18, marginBottom: 12, cursor: 'pointer', width: '100%', textAlign: 'left' };
const optIcon: React.CSSProperties = { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const textInp: React.CSSProperties = { width: '100%', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '13px 14px', fontSize: 15, color: '#0f172a', background: '#f8fafc', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
const lbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 8, marginTop: 14 };
const errBox: React.CSSProperties = { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 12, marginTop: 14, fontSize: 13, color: '#dc2626' };
const cancelBtn: React.CSSProperties = { flex: 1, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 600, color: '#64748b', cursor: 'pointer' };