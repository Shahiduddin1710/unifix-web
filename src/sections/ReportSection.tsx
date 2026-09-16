import React, { useState, useEffect, useCallback } from 'react';
import { complaintsAPI, masterAPI } from '../utils/api';
import { uploadToCloudinary } from '../utils/cloudinary';
import { MapPin, Camera, ImageIcon, ArrowLeft, TriangleAlert } from '../components/Icons';

interface Props { onBack: () => void; onSuccess: (ticketId: string) => void; }

export default function ReportSection({ onBack, onSuccess }: Props) {
  const [masterData, setMasterData] = useState<any>(null);
  const [masterLoading, setMasterLoading] = useState(true);
  const [availabilityOpen, setAvailabilityOpen] = useState(true);
  const [availabilityMsg, setAvailabilityMsg] = useState('');
  const [category, setCategory] = useState('');
  const [subIssue, setSubIssue] = useState('');
  const [description, setDescription] = useState('');
  const [roomInput, setRoomInput] = useState('');
  const [resolvedRoom, setResolvedRoom] = useState<{ building: string; label: string } | null>(null);
  const [roomError, setRoomError] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' && window.innerWidth >= 1024);
  const [isTablet, setIsTablet] = useState(typeof window !== 'undefined' && window.innerWidth >= 768 && window.innerWidth < 1024);

  useEffect(() => {
    const handler = () => {
      setIsDesktop(window.innerWidth >= 1024);
      setIsTablet(window.innerWidth >= 768 && window.innerWidth < 1024);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  useEffect(() => {
    (async () => {
      try { const data = await masterAPI.getData(); setMasterData(data); } catch {}
      finally { setMasterLoading(false); }
    })();
    (async () => {
      try {
        const res = await complaintsAPI.settings();
        setAvailabilityOpen(res.isCurrentlyOpen ?? true);
        if (!res.isCurrentlyOpen) setAvailabilityMsg(`Complaint submissions are currently closed.\n${res.openingTime} – ${res.closingTime}`);
      } catch { setAvailabilityOpen(true); }
    })();
  }, []);

  const handleRoom = useCallback((val: string) => {
    setRoomInput(val); setRoomError('');
    if (!val.trim()) { setResolvedRoom(null); return; }
    const buildings: any[] = masterData?.buildings ?? [];
    for (const b of buildings) {
      const room = (b.rooms ?? []).find((r: any) => r.roomNumber.toUpperCase() === val.trim().toUpperCase());
      if (room) { setResolvedRoom({ building: b.name, label: room.roomName }); return; }
    }
    setResolvedRoom(null);
    if (val.trim().length >= 3) setRoomError('Room not found. Try e.g. 319, 214, 003A.');
  }, [masterData]);

  const categories = masterData?.categories ?? [];
  const selectedCat = categories.find((c: any) => c.name.toLowerCase() === category.toLowerCase());
  const subIssues: string[] = selectedCat?.subCategories.map((s: any) => s.name) ?? [];

  const handleSubmit = async () => {
    setError('');
    if (!subIssue) return setError('Please select the specific issue.');
    if (!resolvedRoom) return setError('Please enter a valid room number.');
    setSubmitting(true);
    try {
      let photoUrl: string | null = null;
      if (photo) { setUploadingPhoto(true); photoUrl = await uploadToCloudinary(photo, 'complaints'); setUploadingPhoto(false); }
      const data = await complaintsAPI.submit({
        category: category || 'others', subIssue, customIssue: null,
        description: description.trim(),
        building: `${resolvedRoom.building}, Room ${roomInput.trim()}`,
        roomDetail: `${roomInput.trim()}, ${resolvedRoom.label}`, photoUrl,
      });
      onSuccess(data.ticketId);
    } catch (err: any) {
      setError(err.message || 'Failed to submit. Please check your connection.');
    } finally { setSubmitting(false); setUploadingPhoto(false); }
  };

  if (isDesktop) {
    return (
      <div style={{ flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 40px' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <button onClick={onBack} style={{ width: 38, height: 38, borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                  <ArrowLeft size={16} color="#374151" />
                </button>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 2 }}>Campus Facilities</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Report Issue</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 8, borderRadius: 4, background: '#16a34a' }} />
                <div style={{ width: 32, height: 8, borderRadius: 4, background: '#e2e8f0' }} />
                <div style={{ width: 32, height: 8, borderRadius: 4, background: '#e2e8f0' }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 26, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: -0.5 }}>What's the issue?</h2>
              <p style={{ fontSize: 13, color: '#64748b' }}>Please provide accurate details about the campus maintenance request.</p>
            </div>

            {!availabilityOpen && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', padding: 16, marginBottom: 24, color: '#dc2626', fontSize: 13 }}>
                <TriangleAlert size={16} color="#dc2626" />
                <div><strong>Complaints Currently Closed</strong><br /><span style={{ fontSize: 12 }}>{availabilityMsg}</span></div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 32, alignItems: 'start' }}>

              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '32px 36px' }}>                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 14 }}>Select Category</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {masterLoading ? (
                      <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading...</span>
                    ) : categories.map((cat: any) => {
                      const active = category === cat.name.toLowerCase();
                      return (
                        <button key={cat.id} onClick={() => { setCategory(cat.name.toLowerCase()); setSubIssue(''); }}
                          style={{ padding: '9px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: active ? '1.5px solid #16a34a' : '1.5px solid #e2e8f0', background: active ? '#16a34a' : '#f8fafc', color: active ? '#fff' : '#374151', cursor: 'pointer', transition: 'all 0.15s' }}>
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {subIssues.length > 0 && (
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Specific Issue</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {subIssues.map(issue => (
                        <button key={issue} onClick={() => setSubIssue(subIssue === issue ? '' : issue)}
                          style={{ padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 500, border: subIssue === issue ? '1.5px solid #16a34a' : '1.5px solid #e2e8f0', background: subIssue === issue ? '#f0fdf4' : '#f8fafc', color: subIssue === issue ? '#16a34a' : '#374151', cursor: 'pointer' }}>
                          {issue}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Location</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: resolvedRoom ? '#f0fdf4' : '#fff', borderRadius: 12, border: `1.5px solid ${resolvedRoom ? '#16a34a' : roomError ? '#ef4444' : '#e2e8f0'}`, padding: '0 14px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                      <MapPin size={16} color={resolvedRoom ? '#16a34a' : '#94a3b8'} />
                      <input style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#0f172a', padding: '13px 0', outline: 'none' }} placeholder="Enter room number e.g. 214" value={roomInput} onChange={e => handleRoom(e.target.value)} maxLength={5} />
                    </div>
                    {resolvedRoom && <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', marginTop: 6, border: '1px solid #bbf7d0', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Room {roomInput}, {resolvedRoom.label}, {resolvedRoom.building}</div>}
                    {roomError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{roomError}</div>}
                  </div>

                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Add Photo</div>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', background: '#f8fafc', minHeight: 50, gap: 8 }}>
                      {photo ? (
                        <>
                          <ImageIcon size={18} color="#16a34a" />
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.name}</span>
                          <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>Change</span>
                        </>
                      ) : (
                        <>
                          <Camera size={18} color="#94a3b8" />
                          <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>Upload photo</span>
                          <span style={{ fontSize: 11, color: '#cbd5e1' }}>(JPG/PNG)</span>
                        </>
                      )}
                      <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>

                <div style={{ marginBottom: 28 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Description</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Max 500 characters</div>
                  </div>
                  <textarea style={{ width: '100%', borderRadius: 12, border: '1.5px solid #e2e8f0', padding: '13px 14px', fontSize: 14, color: '#0f172a', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 110, background: '#fff' }}
                    placeholder="Describe the issue in detail..." value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={500} />
                </div>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 20, border: '1px solid #fecaca', fontSize: 13, color: '#dc2626' }}>
                    <TriangleAlert size={14} color="#dc2626" />{error}
                  </div>
                )}

                <button onClick={handleSubmit} disabled={submitting || !availabilityOpen}
                  style={{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '15px 0', fontSize: 15, fontWeight: 700, cursor: submitting || !availabilityOpen ? 'not-allowed' : 'pointer', opacity: submitting || !availabilityOpen ? 0.55 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 8px rgba(22,163,74,0.2)' }}>
                  {submitting ? (uploadingPhoto ? 'Uploading photo...' : 'Submitting...') : 'Submit Report'}
                  {!submitting && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>}
                </button>
                <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 12 }}>By submitting, you agree to our maintenance guidelines.</div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '28px 28px' }}>                  <div style={{ marginBottom: 18 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 999, padding: '4px 12px', fontSize: 11, fontWeight: 700, color: '#16a34a', marginBottom: 12 }}>
                      <div style={{ width: 6, height: 6, borderRadius: 3, background: '#16a34a' }} />
                      Campus Engineering Dispatch
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', marginBottom: 6 }}>Help keep our campus safe & functional</div>
                    <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>Work orders with accurate room locations and photos are resolved up to 40% faster by campus engineering.</div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>, title: 'Specify Hall & Room Number', desc: 'Include the exact room number e.g. 214, 319. Add nearby landmarks if outdoors.' },
                      { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>, title: 'Attach Clear Photos', desc: 'Helps the technician bring correct replacement parts before arriving on site.' },
                      { icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>, title: 'Real-Time Work Order Tracking', desc: 'Track ticket dispatch, technician assignment and sign-off directly in your complaints tab.' },
                    ].map((item, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: '#f8fafc', borderRadius: 12, padding: 12, border: '1px solid #f1f5f9' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{item.icon}</div>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{item.title}</div>
                          <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5 }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 16, borderRadius: 12, background: '#fffbeb', border: '1px solid #fde68a', padding: 12, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    <div style={{ fontSize: 12, color: '#92400e' }}>
                      <strong style={{ display: 'block', marginBottom: 2 }}>Urgent Campus Emergency?</strong>
                      Contact your campus maintenance office directly for immediate electrical or water hazards.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div style={{ flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 60px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                  <ArrowLeft size={16} color="#374151" />
                </button>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: '#94a3b8', textTransform: 'uppercase' }}>Campus Facilities</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Report Issue</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <div style={{ width: 28, height: 7, borderRadius: 4, background: '#16a34a' }} />
                <div style={{ width: 28, height: 7, borderRadius: 4, background: '#e2e8f0' }} />
                <div style={{ width: 28, height: 7, borderRadius: 4, background: '#e2e8f0' }} />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 4 }}>What's the issue?</h2>
              <p style={{ fontSize: 13, color: '#64748b' }}>Please provide details about the maintenance request.</p>
            </div>

            {!availabilityOpen && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', padding: 14, marginBottom: 20, color: '#dc2626', fontSize: 13 }}>
                <TriangleAlert size={16} color="#dc2626" />
                <div><strong>Complaints Currently Closed</strong><br /><span style={{ fontSize: 12 }}>{availabilityMsg}</span></div>
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', padding: '24px 28px' }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Select Category</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {masterLoading ? <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading...</span> : categories.map((cat: any) => {
                    const active = category === cat.name.toLowerCase();
                    return (
                      <button key={cat.id} onClick={() => { setCategory(cat.name.toLowerCase()); setSubIssue(''); }}
                        style={{ padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, border: active ? '1.5px solid #16a34a' : '1.5px solid #e2e8f0', background: active ? '#16a34a' : '#f8fafc', color: active ? '#fff' : '#374151', cursor: 'pointer' }}>
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {subIssues.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 10 }}>Specific Issue</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {subIssues.map(issue => (
                      <button key={issue} onClick={() => setSubIssue(subIssue === issue ? '' : issue)}
                        style={{ padding: '8px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500, border: subIssue === issue ? '1.5px solid #16a34a' : '1.5px solid #e2e8f0', background: subIssue === issue ? '#f0fdf4' : '#f8fafc', color: subIssue === issue ? '#16a34a' : '#374151', cursor: 'pointer' }}>
                        {issue}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Location</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: resolvedRoom ? '#f0fdf4' : '#fff', borderRadius: 10, border: `1.5px solid ${resolvedRoom ? '#16a34a' : roomError ? '#ef4444' : '#e2e8f0'}`, padding: '0 12px' }}>
                    <MapPin size={16} color={resolvedRoom ? '#16a34a' : '#94a3b8'} />
                    <input style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#0f172a', padding: '12px 0', outline: 'none' }} placeholder="Enter room number e.g. 214" value={roomInput} onChange={e => handleRoom(e.target.value)} maxLength={5} />
                  </div>
                  {resolvedRoom && <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 10px', marginTop: 6, border: '1px solid #bbf7d0', fontSize: 12, color: '#16a34a', fontWeight: 600 }}>Room {roomInput}, {resolvedRoom.label}, {resolvedRoom.building}</div>}
                  {roomError && <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>{roomError}</div>}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Add Photo</div>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px dashed #e2e8f0', borderRadius: 10, padding: '10px 14px', cursor: 'pointer', background: '#f8fafc', minHeight: 50, gap: 8 }}>
                    {photo ? (
                      <>
                        <ImageIcon size={16} color="#16a34a" />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#0f172a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{photo.name}</span>
                        <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>Change</span>
                      </>
                    ) : (
                      <>
                        <Camera size={16} color="#94a3b8" />
                        <span style={{ fontSize: 13, color: '#94a3b8' }}>Upload photo</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Description</div>
                  <div style={{ fontSize: 11, color: '#94a3b8' }}>Max 500 characters</div>
                </div>
                <textarea style={{ width: '100%', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '12px 14px', fontSize: 14, color: '#0f172a', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 110, background: '#fff' }}
                  placeholder="Describe the issue in detail..." value={description} onChange={e => setDescription(e.target.value)} rows={4} maxLength={500} />
              </div>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16, border: '1px solid #fecaca', fontSize: 13, color: '#dc2626' }}>
                  <TriangleAlert size={14} color="#dc2626" />{error}
                </div>
              )}

              <button onClick={handleSubmit} disabled={submitting || !availabilityOpen}
                style={{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px 0', fontSize: 15, fontWeight: 700, cursor: submitting || !availabilityOpen ? 'not-allowed' : 'pointer', opacity: submitting || !availabilityOpen ? 0.55 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 2px 8px rgba(22,163,74,0.2)' }}>
                {submitting ? (uploadingPhoto ? 'Uploading photo...' : 'Submitting...') : 'Submit Report'}
                {!submitting && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>}
              </button>
              <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 10 }}>By submitting, you agree to our maintenance guidelines.</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={hero}>
        <div style={heroHeader}>
          <button onClick={onBack} style={backBtn}><ArrowLeft size={18} color="#374151" /></button>
          <span style={heroTitle}>Report Issue</span>
          <div style={{ width: 32 }} />
        </div>
        <div style={progressDots}>
          <div style={{ ...dot, background: '#16a34a', width: 32 }} />
          <div style={dot} /><div style={dot} />
        </div>
        <div style={mainTitle}>What's the issue?</div>
        <div style={subText}>Please provide details about the maintenance request.</div>
      </div>
      {!availabilityOpen && (
        <div style={closedBanner}><TriangleAlert size={16} color="#dc2626" /><strong>Complaints Currently Closed</strong><br /><span style={{ fontSize: 12 }}>{availabilityMsg}</span></div>
      )}
      <div style={formOuter}>
        <div style={formInner}>
          <div style={sectionLabel}>SELECT CATEGORY</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 4 }}>
            {masterLoading ? <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading...</span> : categories.map((cat: any) => {
              const active = category === cat.name.toLowerCase();
              return (
                <button key={cat.id} onClick={() => { setCategory(cat.name.toLowerCase()); setSubIssue(''); }} style={{ ...catBtn, ...(active ? catBtnActive : {}) }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#fff' : '#374151' }}>{cat.name}</span>
                </button>
              );
            })}
          </div>
          {subIssues.length > 0 && (
            <div style={twoColSection}>
              <div style={fieldLbl}>Specific Issue</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {subIssues.map(issue => (
                  <button key={issue} onClick={() => setSubIssue(subIssue === issue ? '' : issue)} style={{ ...subBtn, ...(subIssue === issue ? subBtnActive : {}) }}>
                    <span style={{ fontSize: 13, fontWeight: 500, color: subIssue === issue ? '#16a34a' : '#374151' }}>{issue}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div style={desktopGrid}>
            <div>
              <div style={fieldLbl}>Location</div>
              <div style={{ ...roomWrap, ...(resolvedRoom ? roomValid : roomError ? roomErr : {}) }}>
                <MapPin size={16} color={resolvedRoom ? '#16a34a' : '#94a3b8'} />
                <input style={roomInp} placeholder="Enter room number e.g. 214" value={roomInput} onChange={e => handleRoom(e.target.value)} maxLength={5} />
              </div>
              {resolvedRoom && <div style={resolvedBox}>Room {roomInput}, {resolvedRoom.label}, {resolvedRoom.building}</div>}
              {roomError && <div style={errSmall}>{roomError}</div>}
            </div>
            <div>
              <div style={fieldLbl}>Add Photo</div>
              <div style={photoBox}>
                {photo ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={22} color="#16a34a" />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{photo.name}</div>
                      <div style={{ fontSize: 12, color: '#16a34a' }}>Ready to upload</div>
                    </div>
                    <label style={{ color: '#16a34a', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      Change<input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                    </label>
                  </div>
                ) : (
                  <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <Camera size={28} color="#94a3b8" />
                    <span style={{ fontSize: 13, color: '#94a3b8' }}>Upload photo</span>
                    <input type="file" accept="image/*" capture="environment" onChange={e => setPhoto(e.target.files?.[0] ?? null)} style={{ display: 'none' }} />
                  </label>
                )}
              </div>
            </div>
          </div>
          <div style={fieldLbl}>Description</div>
          <textarea style={textarea} placeholder="Describe the issue in detail..." value={description} onChange={e => setDescription(e.target.value)} rows={4} />
          {error && <div style={errBox}><TriangleAlert size={14} color="#dc2626" />{error}</div>}
          <button onClick={handleSubmit} disabled={submitting || !availabilityOpen} style={{ ...submitBtn, opacity: submitting || !availabilityOpen ? 0.55 : 1 }}>
            {submitting ? (uploadingPhoto ? 'Uploading photo...' : 'Submitting...') : 'Submit Report'}
          </button>
          <div style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 14 }}>By submitting, you agree to our maintenance guidelines.</div>
        </div>
      </div>
    </div>
  );
}

const wrap: React.CSSProperties = { flex: 1, background: '#f8fafc', display: 'flex', flexDirection: 'column', overflow: 'hidden' };
const hero: React.CSSProperties = { background: '#e8f5e9', padding: '32px 20px 20px', flexShrink: 0 };
const heroHeader: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 };
const backBtn: React.CSSProperties = { width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.7)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };
const heroTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#0f172a' };
const progressDots: React.CSSProperties = { display: 'flex', gap: 6, marginBottom: 16 };
const dot: React.CSSProperties = { width: 24, height: 5, borderRadius: 3, background: '#a7d7a9' };
const mainTitle: React.CSSProperties = { fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 6 };
const subText: React.CSSProperties = { fontSize: 13, color: '#4b5563', lineHeight: 1.5 };
const closedBanner: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', gap: 8, background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: 16, color: '#dc2626', lineHeight: 1.6, flexShrink: 0 };
const formOuter: React.CSSProperties = { flex: 1, overflowY: 'auto' };
const formInner: React.CSSProperties = { padding: '20px 20px 80px', maxWidth: 800, width: '100%' };
const sectionLabel: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#16a34a', letterSpacing: 1, marginBottom: 12, marginTop: 4 };
const twoColSection: React.CSSProperties = { marginTop: 16 };
const catBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 24, background: '#fff', border: '1.5px solid #e2e8f0', cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 };
const catBtnActive: React.CSSProperties = { background: '#16a34a', borderColor: '#16a34a' };
const subBtn: React.CSSProperties = { background: '#f8fafc', borderRadius: 20, padding: '8px 14px', border: '1.5px solid #e2e8f0', cursor: 'pointer' };
const subBtnActive: React.CSSProperties = { background: '#f0fdf4', borderColor: '#16a34a' };
const desktopGrid: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginTop: 0 };
const fieldLbl: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8, marginTop: 18 };
const roomWrap: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '0 12px' };
const roomValid: React.CSSProperties = { borderColor: '#16a34a', background: '#f0fdf4' };
const roomErr: React.CSSProperties = { borderColor: '#ef4444' };
const roomInp: React.CSSProperties = { flex: 1, border: 'none', background: 'transparent', fontSize: 14, color: '#0f172a', padding: '13px 0', outline: 'none' };
const resolvedBox: React.CSSProperties = { display: 'flex', alignItems: 'center', background: '#f0fdf4', borderRadius: 8, padding: 10, marginTop: 6, border: '1px solid #bbf7d0', fontSize: 13, color: '#16a34a', fontWeight: 600 };
const errSmall: React.CSSProperties = { fontSize: 12, color: '#dc2626', marginTop: 4 };
const textarea: React.CSSProperties = { width: '100%', borderRadius: 10, border: '1.5px solid #e2e8f0', padding: '13px 14px', fontSize: 14, color: '#0f172a', resize: 'vertical', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', minHeight: 120 };
const photoBox: React.CSSProperties = { background: '#fff', borderRadius: 10, border: '1.5px dashed #e2e8f0', padding: '24px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const errBox: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, background: '#fef2f2', borderRadius: 10, padding: 12, marginTop: 16, border: '1px solid #fecaca', fontSize: 13, color: '#dc2626' };
const submitBtn: React.CSSProperties = { width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '16px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: 28 };