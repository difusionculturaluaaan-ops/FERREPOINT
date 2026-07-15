'use client';

import { useRouter } from 'next/navigation';
import { hasFeature } from '@/lib/plans';
import { ReactNode, useEffect, useState } from 'react';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const router = useRouter();
  const [plan, setPlan] = useState<string>('');

  useEffect(() => {
    const savedPlan = localStorage.getItem('plan');
    setPlan(savedPlan || 'free');
  }, []);

  if (!plan) return null;

  if (!hasFeature(plan, feature)) {
    return (
      fallback || (
        <div
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '0.5rem',
            border: '2px dashed var(--border-color)',
          }}
        >
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            🔒 Esta función está disponible en planes superiores
          </p>
          <button
            onClick={() => router.push('/upgrade')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Upgrade Ahora
          </button>
        </div>
      )
    );
  }

  return <>{children}</>;
}
