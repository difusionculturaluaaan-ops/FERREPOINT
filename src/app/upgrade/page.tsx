'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';
import { DashboardButton } from '@/components/DashboardButton';
import { MODULE_DETAILS } from '@/lib/plans';

export default function UpgradePage() {
  const router = useRouter();
  const [enabledModules, setEnabledModules] = useState<string[]>([]);
  const [businessName, setBusinessName] = useState<string>('Mi Ferretería');

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        if (Array.isArray(user.enabledModules)) {
          setEnabledModules(user.enabledModules);
        }
        if (user.name) {
          setBusinessName(user.name);
        }
      }
    } catch (e) {
      console.error('Error loading modular context:', e);
    }
  }, []);

  const buildRequestWhatsAppUrl = (moduleLabel: string) => {
    const text = `Hola equipo FERREPOINT! 👋 Me gustaría solicitar la activación a la medida del *${moduleLabel}* para mi ferretería (*${businessName}*). ¿Me podrían ayudar con la cotización y activación?`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800', color: 'var(--accent-orange)' }}>
            🧱 Activación Modular a la Medida
          </h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            FERREPOINT activa módulos de forma independiente según las necesidades de tu ferretería
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <DashboardButton />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: '2rem 1.5rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span
            style={{
              background: 'var(--nal, #FFF0E6)',
              color: 'var(--accent-orange)',
              padding: '6px 16px',
              borderRadius: '20px',
              fontWeight: '700',
              fontSize: '0.85rem',
              display: 'inline-block',
              marginBottom: '0.75rem'
            }}
          >
            CRECIMIENTO FLEXIBLE Y ESCALABLE
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
            Módulos y Procesos Habilitados
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: '700px', margin: '0 auto' }}>
            Selecciona y solicita los módulos que requiera tu operación. No pagas por herramientas que no utilices.
          </p>
        </div>

        {/* Modules Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.5rem',
            marginBottom: '3rem',
          }}
        >
          {Object.entries(MODULE_DETAILS).map(([key, mod]) => {
            const isEnabled = enabledModules.length === 0 || enabledModules.includes(key);

            return (
              <div
                key={key}
                style={{
                  backgroundColor: 'var(--bg-secondary)',
                  border: isEnabled ? '2px solid #10B981' : '1px solid var(--border-color)',
                  borderRadius: '1rem',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  boxShadow: isEnabled ? '0 4px 16px rgba(16, 185, 129, 0.1)' : 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                    <div style={{ fontSize: '2.2rem' }}>{mod.icon}</div>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '800',
                        textTransform: 'uppercase',
                        background: isEnabled ? '#E8F5E9' : 'var(--bg-primary)',
                        color: isEnabled ? '#2E7D32' : 'var(--text-secondary)',
                        border: isEnabled ? '1px solid #A5D6A7' : '1px solid var(--border-color)'
                      }}
                    >
                      {isEnabled ? '✓ Activo' : '🔒 Disponible'}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', margin: '0 0 0.5rem 0', color: 'var(--text-primary)' }}>
                    {mod.label}
                  </h3>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: '0 0 1.25rem 0', lineHeight: '1.5' }}>
                    {mod.desc}
                  </p>
                </div>

                <div>
                  {isEnabled ? (
                    <button
                      onClick={() => router.push(`/${key === 'pos' ? 'pos' : key}`)}
                      style={{
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        cursor: 'pointer',
                      }}
                    >
                      Ingresar al Módulo →
                    </button>
                  ) : (
                    <a
                      href={buildRequestWhatsAppUrl(mod.label)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block',
                        width: '100%',
                        padding: '0.75rem',
                        backgroundColor: 'var(--accent-orange)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        fontWeight: '700',
                        fontSize: '0.9rem',
                        textAlign: 'center',
                        textDecoration: 'none',
                        boxSizing: 'border-box'
                      }}
                    >
                      💬 Solicitar Activación vía WhatsApp
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Contact Banner */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            border: '2px solid var(--accent-orange)',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0 0 0.5rem 0' }}>
            ¿Necesitas un módulo personalizado o múltiples sucursales?
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.25rem', maxWidth: '650px', margin: '0 auto 1.25rem auto' }}>
            El equipo técnico de FERREPOINT ajusta la plataforma a los procesos de tu negocio. Ponte en contacto para personalizar la configuración.
          </p>
          <a
            href="https://api.whatsapp.com/send?text=Hola%20FERREPOINT%2C%20quisiera%20asesor%C3%ADa%20para%20personalizar%20m%C3%B3dulos%20para%20mi%20ferretera."
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-block',
              padding: '0.85rem 2rem',
              backgroundColor: '#25D366',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              fontWeight: '800',
              fontSize: '1rem',
              boxShadow: '0 4px 14px rgba(37,211,102,0.35)'
            }}
          >
            💬 Contactar Soporte FERREPOINT
          </a>
        </div>
      </div>
    </div>
  );
}
