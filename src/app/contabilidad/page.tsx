'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  actionGetFinancialSummary,
  actionGetCxCSummary,
  actionGetCxPSummary,
  actionGetCashCloseHistory,
  actionCreateCashClose,
  actionGetTodayCashCloseSummary
} from '@/features/contabilidad/server';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';
import { DashboardButton } from '@/components/DashboardButton';

export default function ContabilidadPage() {
  const [activeTab, setActiveTab] = useState<'estado' | 'cxc' | 'cxp' | 'corte'>('estado');
  const [range, setRange] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [businessId, setBusinessId] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Financial Data States
  const [financialSummary, setFinancialSummary] = useState<any>(null);
  const [cxcSummary, setCxcSummary] = useState<any>(null);
  const [cxpSummary, setCxpSummary] = useState<any>(null);
  const [todayCashSummary, setTodayCashSummary] = useState<any>(null);
  const [cashCloses, setCashCloses] = useState<any[]>([]);

  // Form states for Cash Close
  const [initialCash, setInitialCash] = useState<string>('500');
  const [finalCash, setFinalCash] = useState<string>('');
  const [observations, setObservations] = useState<string>('');
  const [isSubmittingClose, setIsSubmittingClose] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // Load context on mount
  useEffect(() => {
    const loadContext = async () => {
      let bId = localStorage.getItem('businessId') || '';
      let lId = localStorage.getItem('locationId') || '';

      if (!bId) {
        try {
          const res = await fetch('/api/pos/context');
          const data = await res.json();
          if (data && !data.error) {
            bId = data.businessId;
            lId = data.locationId;
          }
        } catch (err) {
          console.error('Error fetching context route:', err);
        }
      }

      setBusinessId(bId || 'default');
      setLocationId(lId || 'default');
    };

    loadContext();
  }, []);

  // Load accounting data
  const loadData = useCallback(async () => {
    if (!businessId) return;
    setIsLoading(true);
    try {
      const [finRes, cxcRes, cxpRes, closesRes, todayCashRes] = await Promise.all([
        actionGetFinancialSummary(businessId, locationId, range),
        actionGetCxCSummary(businessId, locationId),
        actionGetCxPSummary(businessId),
        actionGetCashCloseHistory(businessId, locationId),
        actionGetTodayCashCloseSummary(businessId, locationId)
      ]);

      setFinancialSummary(finRes);
      setCxcSummary(cxcRes);
      setCxpSummary(cxpRes);
      setCashCloses(closesRes || []);
      setTodayCashSummary(todayCashRes);
    } catch (err) {
      console.error('Error loading accounting data:', err);
      showToast('Error al cargar datos contables', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, locationId, range, showToast]);

  useEffect(() => {
    if (businessId) {
      loadData();
    }
  }, [businessId, range, loadData]);

  // Cash Close Handler
  const handleCreateCashClose = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalCash || isNaN(parseFloat(finalCash))) {
      showToast('Ingresa el monto de efectivo contado en caja', 'error');
      return;
    }

    setIsSubmittingClose(true);
    try {
      const initVal = parseFloat(initialCash) || 0;
      const finalVal = parseFloat(finalCash);
      const res = await actionCreateCashClose(businessId, locationId, initVal, finalVal, observations);

      if (res.success) {
        showToast('✓ Corte de caja registrado correctamente', 'success');
        setFinalCash('');
        setObservations('');
        await loadData();
      } else {
        showToast((res as any).error || 'Error al guardar corte de caja', 'error');
      }
    } catch (err) {
      console.error('Error in cash close:', err);
      showToast('Error al registrar corte de caja', 'error');
    } finally {
      setIsSubmittingClose(false);
    }
  };

  const expectedCashTotal = (parseFloat(initialCash) || 0) + (todayCashSummary?.totalEfectivo || 0);
  const enteredFinalCash = parseFloat(finalCash) || 0;
  const cashDifference = finalCash ? enteredFinalCash - expectedCashTotal : 0;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0 }}>
            📊 Contabilidad & Finanzas
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '0.25rem 0 0 0' }}>
            Estado de resultados, márgenes de utilidad, CxC, CxP y arqueos de caja
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <DashboardButton />
          <ThemeToggle />
          <LogoutButton />
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            padding: '1rem 1.5rem',
            backgroundColor: toast.type === 'success' ? '#10b981' : '#ef4444',
            color: 'white',
            borderRadius: '0.5rem',
            zIndex: 100,
            fontSize: '0.875rem',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          {toast.message}
        </div>
      )}

      {/* Navigation Tabs Bar */}
      <div style={{ backgroundColor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)', padding: '0.75rem 1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'estado', label: '📈 Estado de Resultados' },
          { id: 'cxc', label: '💳 Cuentas por Cobrar (CxC)' },
          { id: 'cxp', label: '🏛️ Cuentas por Pagar (CxP)' },
          { id: 'corte', label: '🔒 Corte de Caja' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '0.5rem',
              border: 'none',
              backgroundColor: activeTab === tab.id ? 'var(--accent-orange, #e8632c)' : 'var(--bg-primary)',
              color: activeTab === tab.id ? '#ffffff' : 'var(--text-primary)',
              fontWeight: '700',
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem' }}>
        
        {/* TAB 1: ESTADO DE RESULTADOS */}
        {activeTab === 'estado' && (
          <div>
            {/* Range Selector Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0 }}>
                Resumen Financiero y Utilidad
              </h2>
              <div style={{ display: 'flex', gap: '0.4rem', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                {[
                  { id: 'today', label: 'Hoy' },
                  { id: 'week', label: 'Semana' },
                  { id: 'month', label: 'Mes' },
                  { id: 'all', label: 'Histórico' }
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setRange(r.id as any)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '6px',
                      border: 'none',
                      background: range === r.id ? 'var(--accent-orange, #e8632c)' : 'transparent',
                      color: range === r.id ? '#fff' : 'var(--text-primary)',
                      fontWeight: '600',
                      fontSize: '0.82rem',
                      cursor: 'pointer'
                    }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>Cargando estado de resultados...</div>
            ) : financialSummary ? (
              <div>
                {/* Primary Financial KPIs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Ingresos Totales (Ventas)</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', margin: '0.4rem 0 0 0' }}>
                      ${financialSummary.grossIncome.toFixed(2)}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{financialSummary.totalSales} nota(s) de venta</span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Costo de Mercancía</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', margin: '0.4rem 0 0 0' }}>
                      ${financialSummary.totalCost.toFixed(2)}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Costo base de insumos</span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Utilidad Bruta</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: financialSummary.grossProfit >= 0 ? '#10b981' : '#ef4444', margin: '0.4rem 0 0 0' }}>
                      ${financialSummary.grossProfit.toFixed(2)}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Ganancia libre de producto</span>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Margen Promedio</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-orange, #e8632c)', margin: '0.4rem 0 0 0' }}>
                      {financialSummary.marginPercent}%
                    </p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rentabilidad % sobre ventas</span>
                  </div>
                </div>

                {/* Breakdown By Payment Method */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', margin: '0 0 1rem 0', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                    Desglose de Ingresos por Método de Pago
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💵 Efectivo:</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0.25rem 0 0 0' }}>${financialSummary.efectivoTotal.toFixed(2)}</p>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>💳 Tarjeta:</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0.25rem 0 0 0' }}>${financialSummary.tarjetaTotal.toFixed(2)}</p>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>🏛️ Transferencia:</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0.25rem 0 0 0' }}>${financialSummary.transferenciaTotal.toFixed(2)}</p>
                    </div>
                    <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📝 Crédito (Fiado):</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: '0.25rem 0 0 0' }}>${financialSummary.creditoTotal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Sales Breakdown Table */}
                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 1rem 0' }}>
                    Detalle de Ventas Registradas en el Período ({financialSummary.salesList.length})
                  </h3>
                  {financialSummary.salesList.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No hay ventas registradas en este período.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '0.75rem' }}>Folio</th>
                            <th style={{ padding: '0.75rem' }}>Fecha/Hora</th>
                            <th style={{ padding: '0.75rem' }}>Cliente</th>
                            <th style={{ padding: '0.75rem' }}>Método Pago</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Venta</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Costo Est.</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Utilidad</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialSummary.salesList.map((s: any) => (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.75rem', fontWeight: '700' }}>#{s.folio}</td>
                              <td style={{ padding: '0.75rem' }}>{new Date(s.createdAt).toLocaleString('es-MX')}</td>
                              <td style={{ padding: '0.75rem' }}>{s.clientName}</td>
                              <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{s.paymentMethod}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', color: '#10b981' }}>${s.total.toFixed(2)}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', color: '#ef4444' }}>${s.cost.toFixed(2)}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', color: 'var(--accent-orange, #e8632c)' }}>${s.profit.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Sin datos para mostrar</div>
            )}
          </div>
        )}

        {/* TAB 2: CUENTAS POR COBRAR (CxC) */}
        {activeTab === 'cxc' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', marginTop: 0 }}>
              Cuentas por Cobrar (Ventas a Crédito / Fiado)
            </h2>
            {cxcSummary && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Total Créditos Otorgados</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-orange, #e8632c)', margin: '0.4rem 0 0 0' }}>
                      ${(cxcSummary.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Saldo Pendiente por Cobrar</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', margin: '0.4rem 0 0 0' }}>
                      ${(cxcSummary.pending || 0).toFixed(2)}
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Recuperado / Cobrado</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', margin: '0.4rem 0 0 0' }}>
                      ${(cxcSummary.totalPaid || 0).toFixed(2)}
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Tasa de Cobranza</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#3b82f6', margin: '0.4rem 0 0 0' }}>
                      {(cxcSummary.collectionRate || 0).toFixed(1)}%
                    </p>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 1rem 0' }}>Ventas a Crédito ({cxcSummary.creditSalesList?.length || 0})</h3>
                  {(!cxcSummary.creditSalesList || cxcSummary.creditSalesList.length === 0) ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No hay créditos activos registrados.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '0.75rem' }}>Folio</th>
                            <th style={{ padding: '0.75rem' }}>Cliente</th>
                            <th style={{ padding: '0.75rem' }}>Teléfono</th>
                            <th style={{ padding: '0.75rem' }}>Fecha</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monto Crédito</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center' }}>Estatus</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cxcSummary.creditSalesList.map((s: any) => (
                            <tr key={s.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.75rem', fontWeight: '700' }}>#{s.folio}</td>
                              <td style={{ padding: '0.75rem' }}>{s.clientName || 'Cliente'}</td>
                              <td style={{ padding: '0.75rem' }}>{s.clientPhone || 'N/A'}</td>
                              <td style={{ padding: '0.75rem' }}>{new Date(s.createdAt).toLocaleDateString('es-MX')}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', color: '#ef4444' }}>${s.total.toFixed(2)}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                <span style={{ padding: '3px 8px', borderRadius: '4px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontWeight: '700', fontSize: '0.75rem' }}>PENDIENTE</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CUENTAS POR PAGAR (CxP) */}
        {activeTab === 'cxp' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', marginTop: 0 }}>
              Cuentas por Pagar (Proveedores)
            </h2>
            {cxpSummary && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Total Facturas Proveedores</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--accent-orange, #e8632c)', margin: '0.4rem 0 0 0' }}>
                      ${(cxpSummary.totalAmount || 0).toFixed(2)}
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Pendiente por Pagar</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#ef4444', margin: '0.4rem 0 0 0' }}>
                      ${(cxpSummary.pending || 0).toFixed(2)}
                    </p>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Total Pagado</span>
                    <p style={{ fontSize: '1.6rem', fontWeight: '800', color: '#10b981', margin: '0.4rem 0 0 0' }}>
                      ${(cxpSummary.totalPaid || 0).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', margin: '0 0 1rem 0' }}>Cuentas con Proveedores ({cxpSummary.list?.length || 0})</h3>
                  {(!cxpSummary.list || cxpSummary.list.length === 0) ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>No hay cuentas pendientes por pagar a proveedores.</p>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                            <th style={{ padding: '0.75rem' }}>Proveedor</th>
                            <th style={{ padding: '0.75rem' }}>Orden Compra</th>
                            <th style={{ padding: '0.75rem' }}>Vencimiento</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monto Total</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Saldo Pendiente</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cxpSummary.list.map((item: any) => (
                            <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                              <td style={{ padding: '0.75rem', fontWeight: '700' }}>{item.supplier?.name || 'Proveedor'}</td>
                              <td style={{ padding: '0.75rem' }}>#{item.po?.poNumber || 'N/A'}</td>
                              <td style={{ padding: '0.75rem' }}>{new Date(item.dueDate).toLocaleDateString('es-MX')}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right' }}>${item.amount.toFixed(2)}</td>
                              <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', color: '#ef4444' }}>${(item.amount - item.amountPaid).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CORTE DE CAJA */}
        {activeTab === 'corte' && (
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem', marginTop: 0 }}>
              Corte de Caja & Arqueo Diario
            </h2>

            {/* Today Cash Metrics Banner */}
            {todayCashSummary && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Ventas Efectivo Hoy</span>
                  <p style={{ fontSize: '1.4rem', fontWeight: '800', color: '#10b981', margin: '0.25rem 0 0 0' }}>
                    ${todayCashSummary.totalEfectivo.toFixed(2)}
                  </p>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Ventas Tarjeta Hoy</span>
                  <p style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0.25rem 0 0 0' }}>
                    ${todayCashSummary.totalTarjeta.toFixed(2)}
                  </p>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Ventas Transferencia Hoy</span>
                  <p style={{ fontSize: '1.4rem', fontWeight: '800', margin: '0.25rem 0 0 0' }}>
                    ${todayCashSummary.totalTransferencia.toFixed(2)}
                  </p>
                </div>
                <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>Total Cobrado Hoy</span>
                  <p style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--accent-orange, #e8632c)', margin: '0.25rem 0 0 0' }}>
                    ${todayCashSummary.totalVentas.toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
              
              {/* Cash Close Calculator Form */}
              <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: 0, marginBottom: '1rem' }}>
                  Realizar Arqueo / Corte de Caja
                </h3>

                <form onSubmit={handleCreateCashClose} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                      1. Efectivo Inicial en Fondo de Caja ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej: 500"
                      value={initialCash}
                      onChange={(e) => setInitialCash(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                      2. Efectivo Físico Contado al Cierre ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ingresa la cantidad contada en el cajón"
                      value={finalCash}
                      onChange={(e) => setFinalCash(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.95rem', boxSizing: 'border-box' }}
                      required
                    />
                  </div>

                  {/* Calculated Difference Preview */}
                  <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Efectivo Inicial:</span>
                      <span>${(parseFloat(initialCash) || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>+ Ventas Efectivo Sistema:</span>
                      <span style={{ color: '#10b981', fontWeight: '600' }}>+${(todayCashSummary?.totalEfectivo || 0).toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem', fontWeight: '700' }}>
                      <span>= Efectivo Esperado en Cajón:</span>
                      <span>${expectedCashTotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '800' }}>
                      <span>Diferencia Calculada:</span>
                      <span style={{ color: Math.abs(cashDifference) <= 1 ? '#10b981' : cashDifference < 0 ? '#ef4444' : '#eab308' }}>
                        {cashDifference === 0 ? '🟢 Cuadrado ($0.00)' : cashDifference < 0 ? `🔴 Faltante (-$${Math.abs(cashDifference).toFixed(2)})` : `🟡 Sobrante (+$${cashDifference.toFixed(2)})`}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>
                      Observaciones o Notas
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Cambio entregado en billetes grandes..."
                      value={observations}
                      onChange={(e) => setObservations(e.target.value)}
                      style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '0.9rem', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingClose}
                    style={{
                      padding: '0.85rem',
                      borderRadius: '0.5rem',
                      border: 'none',
                      background: 'var(--accent-orange, #e8632c)',
                      color: '#ffffff',
                      fontWeight: '700',
                      fontSize: '1rem',
                      cursor: isSubmittingClose ? 'not-allowed' : 'pointer',
                      opacity: isSubmittingClose ? 0.6 : 1,
                      marginTop: '0.5rem'
                    }}
                  >
                    {isSubmittingClose ? 'Guardando Corte...' : '🔒 CREAR CORTE DE CAJA'}
                  </button>
                </form>
              </div>

              {/* Cash Closes History List */}
              <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginTop: 0, marginBottom: '1rem' }}>
                  Historial de Cortes Realizados ({cashCloses.length})
                </h3>

                {cashCloses.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>No hay cortes de caja guardados.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
                    {cashCloses.map((close: any) => (
                      <div
                        key={close.id}
                        style={{
                          padding: '1rem',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: '0.5rem',
                          border: '1px solid var(--border-color)',
                          fontSize: '0.85rem'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: '700' }}>Corte del {new Date(close.date || close.createdAt).toLocaleDateString('es-MX')}</span>
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontWeight: '700',
                              fontSize: '0.72rem',
                              textTransform: 'uppercase',
                              background: close.status === 'cuadrado' ? 'rgba(16,185,129,0.2)' : close.status === 'faltante' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)',
                              color: close.status === 'cuadrado' ? '#10b981' : close.status === 'faltante' ? '#ef4444' : '#eab308'
                            }}
                          >
                            {close.status}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                          <div>Inicial: <strong>${close.initialCash.toFixed(2)}</strong></div>
                          <div>Final Contado: <strong>${close.finalCash.toFixed(2)}</strong></div>
                          <div>Ventas Efec: <strong>${close.totalIngresos.toFixed(2)}</strong></div>
                          <div>Diferencia: <strong style={{ color: close.difference > 0 && close.status !== 'cuadrado' ? '#ef4444' : 'inherit' }}>${close.difference.toFixed(2)}</strong></div>
                        </div>
                        {close.observations && (
                          <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                            &quot;{close.observations}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
