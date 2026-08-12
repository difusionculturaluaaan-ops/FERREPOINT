'use client';

import { useRouter } from 'next/navigation';
import { hasFeature } from '@/lib/plans';
import { actionGetBusinessPlan } from '@/features/auth/server';
import { ReactNode, useEffect, useState } from 'react';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const router = useRouter();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      try {
        const userStr = localStorage.getItem('user');
        const bizId = localStorage.getItem('businessId') || (userStr ? JSON.parse(userStr).businessId : null);
        const savedPlan = localStorage.getItem('plan') || 'starter';

        let enabledMods: string[] | null = null;
        let userObj: any = null;
        if (userStr) {
          userObj = JSON.parse(userStr);
          if (Array.isArray(userObj.enabledModules) && userObj.enabledModules.length > 0) {
            enabledMods = userObj.enabledModules;
          }
        }

        // 1. Verificación inicial local
        let localResult = enabledMods ? enabledMods.includes(feature) : hasFeature(savedPlan, feature);

        if (localResult) {
          if (isMounted) setHasAccess(true);
          return;
        }

        // 2. Si la validación local falla, consultar el servidor para sincronizar cambios recientes del SuperAdmin
        if (bizId) {
          const res = await actionGetBusinessPlan(bizId);
          if (res.success && res.enabledModules) {
            if (userObj) {
              userObj.enabledModules = res.enabledModules;
              localStorage.setItem('user', JSON.stringify(userObj));
            }
            localStorage.setItem('plan', res.plan || 'starter');
            if (isMounted) setHasAccess(res.enabledModules.includes(feature));
            return;
          }
        }

        if (isMounted) setHasAccess(false);
      } catch (e) {
        if (isMounted) setHasAccess(true);
      }
    }

    checkAccess();
    return () => { isMounted = false; };
  }, [feature]);

  if (hasAccess === null) return null;

  if (!hasAccess) {
    return (
      fallback || (
        <div
          style={{
            padding: '3rem 1.5rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: '1rem',
            border: '2px dashed var(--border-color)',
            maxWidth: '520px',
            margin: '3rem auto',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            Módulo No Activado
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            El módulo de <strong>{feature.toUpperCase()}</strong> no está habilitado en la suscripción de tu empresa.
          </p>
          <button
            onClick={() => router.push('/upgrade')}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '700',
              cursor: 'pointer',
            }}
          >
            Solicitar Activación de Módulo
          </button>
        </div>
      )
    );
  }

  return <>{children}</>;
}
