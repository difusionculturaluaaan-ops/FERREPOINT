'use client';

import React from 'react';
import Link from 'next/link';

export function DashboardButton() {
 return (
 <Link
 href="/"
 style={{
 display: 'inline-flex',
 alignItems: 'center',
 gap: '6px',
 padding: '8px 14px',
 borderRadius: '6px',
 backgroundColor: 'var(--accent-orange, #ea580c)',
 color: '#ffffff',
 fontSize: '14px',
 fontWeight: '600',
 textDecoration: 'none',
 border: 'none',
 boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
 cursor: 'pointer',
 transition: 'opacity 0.2s ease'
 }}
 onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
 onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
 >
 <span></span>
 <span>Panel Principal</span>
 </Link>
 );
}
