'use client';

import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PLANS } from '@/lib/plans';

export default function UpgradePage() {
  const router = useRouter();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
      {/* Header */}
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
          🚀 Planes FERREPOINT
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <ThemeToggle />
          <button
            onClick={() => router.back()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent-orange)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            ← Volver
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '0.5rem' }}>
            Elige tu Plan
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            Acceso a más módulos y herramientas para crecer tu ferretería
          </p>
        </div>

        {/* Plans Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem',
          }}
        >
          {Object.entries(PLANS).map(([key, plan]) => (
            <div
              key={key}
              style={{
                backgroundColor: 'var(--bg-secondary)',
                border: '2px solid var(--border-color)',
                borderRadius: '1rem',
                padding: '2rem',
                textAlign: 'center',
                transition: 'all 0.3s',
                transform: key === 'professional' ? 'scale(1.05)' : 'scale(1)',
                boxShadow:
                  key === 'professional'
                    ? '0 10px 30px rgba(232, 99, 44, 0.2)'
                    : 'none',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  key === 'professional' ? 'scale(1.08)' : 'scale(1.03)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform =
                  key === 'professional' ? 'scale(1.05)' : 'scale(1)';
              }}
            >
              {key === 'professional' && (
                <div
                  style={{
                    backgroundColor: 'var(--accent-orange)',
                    color: 'white',
                    padding: '0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: '700',
                    marginBottom: '1rem',
                  }}
                >
                  ⭐ MÁS POPULAR
                </div>
              )}

              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  marginBottom: '0.5rem',
                  margin: key === 'professional' ? '0' : '0',
                }}
              >
                {plan.name}
              </h3>

              <div
                style={{
                  fontSize: '2.5rem',
                  fontWeight: '800',
                  color: 'var(--accent-orange)',
                  marginBottom: '1rem',
                }}
              >
                ${plan.price}
                <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>
                  /mes
                </span>
              </div>

              <div style={{ marginBottom: '1.5rem', textAlign: 'left' }}>
                <div style={{ marginBottom: '0.75rem', fontWeight: '600' }}>
                  Módulos incluidos:
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {plan.modules.map((mod) => (
                    <div key={mod} style={{ marginBottom: '0.5rem' }}>
                      ✓ {mod.charAt(0).toUpperCase() + mod.slice(1)}
                    </div>
                  ))}
                </div>
              </div>

              <div
                style={{
                  textAlign: 'left',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ marginBottom: '0.5rem' }}>
                  👥 Hasta {plan.maxUsers} usuarios
                </div>
                <div>📍 Hasta {plan.maxLocations} sucursales</div>
              </div>

              <button
                onClick={() => {
                  alert(
                    `Plan ${plan.name} - Contacta a soporte para activar: soporte@ferrepoint.com`
                  );
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor:
                    key === 'professional' ? 'var(--accent-orange)' : 'var(--bg-tertiary)',
                  color:
                    key === 'professional' ? 'white' : 'var(--text-primary)',
                  border: 'none',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                }}
              >
                Seleccionar Plan
              </button>
            </div>
          ))}
        </div>

        {/* FAQ */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '2rem',
            borderRadius: '1rem',
            marginTop: '3rem',
          }}
        >
          <h3 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
            ¿Preguntas?
          </h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            Contacta a nuestro equipo de soporte para más información sobre planes personalizados
            o migraciones.
          </p>
          <a
            href="mailto:soporte@ferrepoint.com"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: 'var(--accent-orange)',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '600',
            }}
          >
            Contactar Soporte
          </a>
        </div>
      </div>
    </div>
  );
}
