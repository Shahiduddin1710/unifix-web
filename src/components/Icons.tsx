import React from 'react';

type IconProps = { size?: number; color?: string; strokeWidth?: number };
const ic = (d: string) => ({ size = 18, color = 'currentColor', strokeWidth = 2 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">{d.split('|').map((p, i) => {
    if (p.startsWith('c:')) { const [cx, cy, r] = p.slice(2).split(','); return <circle key={i} cx={cx} cy={cy} r={r} />; }
    if (p.startsWith('rect:')) { const [x, y, w, h, rx] = p.slice(5).split(','); return <rect key={i} x={x} y={y} width={w} height={h} rx={rx} />; }
    if (p.startsWith('line:')) { const [x1, y1, x2, y2] = p.slice(5).split(','); return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />; }
    if (p.startsWith('poly:')) return <polyline key={i} points={p.slice(5)} />;
    return <path key={i} d={p} />;
  })}</svg>
);

export const Mail = ic('M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z|poly:22,6 12,13 2,6');
export const Lock = ic('rect:3,11,18,11,2|M7 11V7a5 5 0 0110 0v4');
export const Eye = ic('M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z|c:12,12,3');
export const EyeOff = ic('M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24|line:1,1,23,23');
export const GraduationCap = ic('M22 10v6M2 10l10-5 10 5-10 5z|M6 12v5c3 3 9 3 12 0v-5');
export const User = ic('M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2|c:12,7,4');
export const Users = ic('M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2|c:9,7,4|M23 21v-2a4 4 0 00-3-3.87|M16 3.13a4 4 0 010 7.75');
export const Wrench = ic('M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z');
export const TriangleAlert = ic('M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z|line:12,9,12,13|line:12,17,12.01,17');
export const Search = ic('c:11,11,8|line:21,21,16.65,16.65');
export const ClipboardList = ic('M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2|rect:9,3,6,4,1|line:9,12,15,12|line:9,16,12,16');
export const MapPin = ic('M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z|c:12,10,3');
export const Calendar = ic('rect:3,4,18,18,2|line:16,2,16,6|line:8,2,8,6|line:3,10,21,10');
export const Phone = ic('M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z');
export const Shield = ic('M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z');
export const Trash2 = ic('M3 6h18|M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2|line:10,11,10,17|line:14,11,14,17');
export const Camera = ic('M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z|c:12,13,4');
export const ImageIcon = ic('rect:3,3,18,18,2|c:8.5,8.5,1.5|M21 15l-5-5L5 21');
export const LogOut = ic('M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4|poly:16,17 21,12 16,7|line:21,12,9,12');
export const Settings = ic('M12 15a3 3 0 100-6 3 3 0 000 6z|M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z');
export const Info = ic('c:12,12,10|line:12,16,12,12|line:12,8,12.01,8');
export const Home = ic('M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z|poly:9,22 9,12 15,12 15,22');
export const Package = ic('M16.5 9.4l-9-5.19|M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z|line:3.27,6.96,12,12.01|line:12,22.08,12,12');
export const CheckCircle = ic('c:12,12,10|poly:9,11 12,14 22,4|M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11');
export const Upload = ic('M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4|poly:17,8 12,3 7,8|line:12,3,12,15');
export const FileText = ic('M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z|poly:14,2 14,8 20,8|line:16,13,8,13|line:16,17,8,17|poly:10,9 9,9 8,9');
export const AlertCircle = ic('c:12,12,10|line:12,8,12,12|line:12,16,12.01,16');
export const ChevronRight = ic('poly:9,18 15,12 9,6');
export const Star = ic('M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
export const X = ic('line:18,6,6,18|line:6,6,18,18');
export const Plus = ic('line:12,5,12,19|line:5,12,19,12');
export const ArrowLeft = ic('line:19,12,5,12|poly:12,19 5,12 12,5');
export const Layers = ic('M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5');
export const CreditCard = ic('rect:1,4,22,16,2|line:1,10,23,10');
export const Clock = ic('c:12,12,10|poly:12,6 12,12 16,14');
export const RefreshCw = ic('M23 4v6h-6|M1 20v-6h6|M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15');