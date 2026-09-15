import React from 'react';

interface Props {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

export default function Modal({ visible, onClose, children, title }: Props) {
  if (!visible) return null;
  return (
    <div style={overlay} onClick={onClose}>
      <div style={sheet} onClick={e => e.stopPropagation()}>
        <div style={handle} />
        {title && <div style={titleStyle}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 500,
};
const sheet: React.CSSProperties = {
  background: '#fff', borderRadius: '24px 24px 0 0', padding: 24,
  width: '100%', maxWidth: 480, maxHeight: '88vh', overflowY: 'auto',
};
const handle: React.CSSProperties = {
  width: 36, height: 4, borderRadius: 2, background: '#e2e8f0',
  margin: '0 auto 20px',
};
const titleStyle: React.CSSProperties = {
  fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 16,
};