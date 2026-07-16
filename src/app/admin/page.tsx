'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';
import { PLANS, type PlanType } from '@/lib/plans';

interface BusinessInfo {
  id: string;
  name: string;
  plan: string;
  rfc: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('free');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadBusiness = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const businessId = localStorage.getItem('businessId');
        const plan = localStorage.getItem('plan');

        if (userStr && businessId) {
          const user = JSON.parse(userStr);
          setBusiness({
            id: businessId,
            name: user.name || 'Ferretería',
            plan: plan || 'free',
            rfc: 'FCE200101ABC'
          });
          setSelectedPlan((plan as PlanType) || 'free');
        }
      } catch (err) {
        console.error('Error loading business:', err);
      } finally {
        setLoading(false);
      }
    };

    loadBusiness();
  }, []);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handlePlanChange = async () => {
    setIsSaving(true);
    try {
      // En producción, llamar a API para actualizar plan
      // Por ahora, solo simulamos
      await new Promise(resolve => setTimeout(resolve, 1000));

      localStorage.setItem('plan', selectedPlan);
      setBusiness(prev => prev ? { ...prev, plan: selectedPlan } : null);
      showToast(`✅ Plan actualizado a ${PLANS[selectedPlan].name}`, 'success');
    } catch (err) {
      showToast('Error al actualizar plan', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Cargando...
      </div>
    );
  }

  if (!business) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        Error: No se pudo cargar la información del negocio
      </div>
    );
  }

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
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
            ⚙️ Administración
          </h1>
          <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Gestiona tu ferretería
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            padding: '1rem 1.5rem',
            backgroundColor: toast.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
            color: 'white',
            borderRadius: '0.5rem',
            zIndex: 50,
            fontWeight: '500',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
        {/* Business Info */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '2rem',
            borderRadius: '1rem',
            marginBottom: '2rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700' }}>
            📦 Información del Negocio
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Nombre
              </p>
              <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                {business.name}
              </p>
            </div>

            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                RFC
              </p>
              <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600' }}>
                {business.rfc}
              </p>
            </div>

            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Plan Actual
              </p>
              <div
                style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: 'var(--accent-orange)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                }}
              >
                {PLANS[business.plan as PlanType]?.name || 'Desconocido'}
              </div>
            </div>

            <div>
              <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Estado
              </p>
              <p style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--accent-green)' }}>
                ✅ Activo
              </p>
            </div>
          </div>
        </div>

        {/* Plan Management */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '2rem',
            borderRadius: '1rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700' }}>
            📋 Cambiar Plan
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            {Object.entries(PLANS).map(([key, plan]) => (
              <div
                key={key}
                onClick={() => setSelectedPlan(key as PlanType)}
                style={{
                  padding: '1.5rem',
                  border: selectedPlan === key ? '2px solid var(--accent-orange)' : '1px solid var(--border-color)',
                  borderRadius: '0.75rem',
                  cursor: 'pointer',
                  backgroundColor:
                    selectedPlan === key ? 'rgba(232, 99, 44, 0.1)' : 'var(--bg-primary)',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedPlan !== key) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent-orange)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedPlan !== key) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-color)';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '700' }}>
                      {plan.name}
                    </h3>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'var(--accent-orange)', fontWeight: '600' }}>
                      ${plan.price}/mes
                    </p>
                  </div>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2px solid var(--accent-orange)',
                      backgroundColor:
                        selectedPlan === key ? 'var(--accent-orange)' : 'transparent',
                    }}
                  />
                </div>

                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    👥 {plan.maxUsers} usuarios
                  </div>
                  <div>📍 {plan.maxLocations} sucursales</div>
                </div>
              </div>
            ))}
          </div>

          {selectedPlan !== business.plan && (
            <button
              onClick={handlePlanChange}
              disabled={isSaving}
              style={{
                padding: '0.75rem 2rem',
                backgroundColor: 'var(--accent-orange)',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                fontWeight: '600',
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
              }}
            >
              {isSaving ? 'Actualizando...' : 'Actualizar Plan'}
            </button>
          )}

          {selectedPlan === business.plan && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              ✓ Este es tu plan actual
            </p>
          )}
        </div>

        {/* Plan Features */}
        <div
          style={{
            backgroundColor: 'var(--bg-secondary)',
            padding: '2rem',
            borderRadius: '1rem',
            marginTop: '2rem',
            border: '1px solid var(--border-color)',
          }}
        >
          <h2 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', fontWeight: '700' }}>
            📚 Módulos Disponibles en {PLANS[selectedPlan].name}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {PLANS[selectedPlan].modules.map(module => (
              <div
                key={module}
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  {module === 'pos' && '🛒'}
                  {module === 'bodega' && '📦'}
                  {module === 'inventario' && '📊'}
                  {module === 'reportes' && '📈'}
                  {module === 'entregas' && '🚚'}
                  {module === 'contabilidad' && '💰'}
                  {module === 'facturacion' && '📄'}
                </div>
                <p style={{ margin: 0, fontWeight: '600' }}>
                  {module.charAt(0).toUpperCase() + module.slice(1)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
