'use client';

import { useState, useEffect } from 'react';

const ROLE_MAP: Record<string, { label: string; icon: string; bg: string; color: string }> = {
  super_admin: { label: 'SuperAdmin', icon: '⚡', bg: '#F3E8FF', color: '#7C3AED' },
  admin: { label: 'Administrador', icon: '🔑', bg: '#DBEAFE', color: '#1D4ED8' },
  dueno: { label: 'Dueño', icon: '👑', bg: '#FEF3C7', color: '#B45309' },
  encargado: { label: 'Encargado', icon: '🏢', bg: '#D1FAE5', color: '#047857' },
  bodeguero: { label: 'Bodeguero', icon: '📦', bg: '#FFEDD5', color: '#C2410C' },
  vendedor: { label: 'Vendedor', icon: '🛒', bg: '#E0F2FE', color: '#0369A1' },
  cajero: { label: 'Cajero', icon: '💵', bg: '#DCFCE7', color: '#15803D' },
  chofer: { label: 'Chofer', icon: '🚚', bg: '#E0E7FF', color: '#4338CA' },
};

export function UserProfileBadge() {
  const [user, setUser] = useState<{ name?: string; role?: string; email?: string } | null>(null);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error('Error loading user profile badge:', e);
    }
  }, []);

  if (!user) return null;

  const roleKey = user.role || 'vendedor';
  const roleInfo = ROLE_MAP[roleKey] || { label: roleKey, icon: '👤', bg: '#F3F4F6', color: '#374151' };
  const displayName = user.name || user.email?.split('@')[0] || 'Usuario';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        backgroundColor: 'var(--bg-secondary, #1f2937)',
        border: '1px solid var(--border-color, #374151)',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.85rem',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: '#10B981',
          display: 'inline-block',
          boxShadow: '0 0 8px #10B981',
        }}
      />
      <span style={{ fontWeight: '700', color: 'var(--text-primary, #fff)' }}>
        {displayName}
      </span>
      <span
        style={{
          fontSize: '0.72rem',
          fontWeight: '800',
          padding: '2px 8px',
          borderRadius: '12px',
          backgroundColor: roleInfo.bg,
          color: roleInfo.color,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <span>{roleInfo.icon}</span>
        <span>{roleInfo.label}</span>
      </span>
    </div>
  );
}
