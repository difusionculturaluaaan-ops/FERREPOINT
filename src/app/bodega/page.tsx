'use client';

import { FeatureGate } from '@/components/FeatureGate';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';

export default function BodegaPage() {
  return (
    <FeatureGate feature="bodega">
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
        <header
          style={{
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
            📦 Bodega
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <ThemeToggle />
            <LogoutButton />
          </div>
        </header>

        <div style={{ padding: '2rem' }}>
          <h2>Órdenes por Preparar</h2>
          <div
            style={{
              padding: '2rem',
              backgroundColor: 'var(--bg-secondary)',
              borderRadius: '0.5rem',
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            ✅ Módulo de Bodega disponible
          </div>
        </div>
      </div>
    </FeatureGate>
  );
}
