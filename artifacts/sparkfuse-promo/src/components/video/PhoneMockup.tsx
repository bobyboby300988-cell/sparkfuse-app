import React from 'react';

export function PhoneMockup({ children, scale = 1 }: { children: React.ReactNode; scale?: number }) {
  return (
    <div style={{
      width: 260 * scale,
      height: 520 * scale,
      borderRadius: 36 * scale,
      background: '#0D0B12',
      border: '2.5px solid rgba(255,255,255,0.15)',
      boxShadow: '0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
      overflow: 'hidden',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Status bar */}
      <div style={{
        height: 28 * scale, background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', flexShrink: 0,
      }}>
        <span style={{ fontFamily: 'Inter', fontSize: 9 * scale, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>9:41</span>
        <div style={{ display: 'flex', gap: 4 * scale, alignItems: 'center' }}>
          <span style={{ fontSize: 8 * scale }}>▲▲▲</span>
          <span style={{ fontSize: 8 * scale }}>📶</span>
          <span style={{ fontSize: 8 * scale }}>🔋</span>
        </div>
      </div>
      {/* Screen content */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>
      {/* Home indicator */}
      <div style={{ height: 20 * scale, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ width: 80 * scale, height: 4 * scale, borderRadius: 2 * scale, background: 'rgba(255,255,255,0.3)' }} />
      </div>
    </div>
  );
}