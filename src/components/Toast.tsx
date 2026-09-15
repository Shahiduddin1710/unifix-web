import React, { useEffect } from 'react';

interface Props {
  message: string;
  type: 'success' | 'error' | 'info';
  onHide: () => void;
}

export default function Toast({ message, type, onHide }: Props) {
  useEffect(() => {
    const t = setTimeout(onHide, 3500);
    return () => clearTimeout(t);
  }, [message]);

  const bg = type === 'success' ? '#16a34a' : type === 'error' ? '#dc2626' : '#2563eb';
  return (
    <div style={{
      position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
      background: bg, color: '#fff', borderRadius: 12, padding: '12px 20px',
      fontSize: 14, fontWeight: 600, zIndex: 9999, maxWidth: 320, textAlign: 'center',
      boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    }}>
      {message}
    </div>
  );
}