'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Tenant {
  id: string;
  name: string;
  rfc: string;
  plan: string;
  requiresCajero: boolean;
  locationsCount: number;
  usersCount: number;
  createdAt: string;
}

export default function SuperAdminPage() {
  const [tenants, setTenants] = useState<Tenant[]>([
    {
      id: 'b1',
      name: 'Ferretería Centro',
      rfc: 'FCE200101ABC',
      plan: 'professional',
      requiresCajero: false,
      locationsCount: 3,
      usersCount: 8,
      createdAt: '2026-01-15'
    },
    {
      id: 'b2',
      name: 'Ferretería El Castillito',
      rfc: 'CAS190812XYZ',
      plan: 'starter',
      requiresCajero: true,
      locationsCount: 1,
      usersCount: 4,
      createdAt: '2026-02-01'
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [showNewTenantModal, setShowNewTenantModal] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newBusinessRfc, setNewBusinessRfc] = useState('');
  const [newBusinessPlan, setNewBusinessPlan] = useState('professional');
  const [adminEmail, setAdminEmail] = useState('');

  const handleCreateTenant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName.trim() || !newBusinessRfc.trim() || !adminEmail.trim()) return;

    const newTenant: Tenant = {
      id: `b${tenants.length + 1}`,
      name: newBusinessName,
      rfc: newBusinessRfc.toUpperCase(),
      plan: newBusinessPlan,
      requiresCajero: false,
      locationsCount: 1,
      usersCount: 1,
      createdAt: new Date().toISOString().split('T')[0]
    };

    setTenants([newTenant, ...tenants]);
    setNewBusinessName('');
    setNewBusinessRfc('');
    setAdminEmail('');
    setShowNewTenantModal(false);
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#111827', margin: 0 }}>
            ⚡ PANEL GLOBAL SUPER ADMIN — FERREPOINT SaaS
          </h1>
          <p style={{ color: '#6B7280', fontSize: '14px', margin: '4px 0 0' }}>
            Administración Multitenant de empresas cliente, planes y sucursales
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowNewTenantModal(true)}
            style={{
              background: '#F97316',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontWeight: '700',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            + Nueva Empresa Client (Tenant)
          </button>
          <Link
            href="/"
            style={{
              background: '#E5E7EB',
              color: '#374151',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              textDecoration: 'none'
            }}
          >
            Volver al Dashboard
          </Link>
        </div>
      </header>

      {/* KPI Cards Globales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>
            Empresas Clientes
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#F97316', marginTop: '4px' }}>
            {tenants.length}
          </div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>100% Activas</div>
        </div>

        <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>
            Sucursales Totales
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#2563EB', marginTop: '4px' }}>
            {tenants.reduce((a, b) => a + b.locationsCount, 0)}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>En todas las ferreterías</div>
        </div>

        <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>
            Usuarios Activos
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#10B981', marginTop: '4px' }}>
            {tenants.reduce((a, b) => a + b.usersCount, 0)}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>Admins, encargados y personal</div>
        </div>

        <div style={{ background: '#fff', padding: '18px', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
          <div style={{ fontSize: '12px', color: '#6B7280', fontWeight: '600', textTransform: 'uppercase' }}>
            Suscripción SaaS
          </div>
          <div style={{ fontSize: '32px', fontWeight: '900', color: '#8B5CF6', marginTop: '4px' }}>
            ${tenants.length * 1499}
          </div>
          <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>MXN / mes acumulado</div>
        </div>
      </div>

      {/* Tabla de Empresas Tenants */}
      <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>
            🏢 Empresas Registradas (Tenants Multi-Empresa)
          </h3>
          <span style={{ fontSize: '12px', color: '#6B7280' }}>Mostrando {tenants.length} registros</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>
              <th style={{ padding: '12px 20px' }}>Empresa Ferretera</th>
              <th style={{ padding: '12px 20px' }}>RFC</th>
              <th style={{ padding: '12px 20px' }}>Plan SaaS</th>
              <th style={{ padding: '12px 20px' }}>Sucursales</th>
              <th style={{ padding: '12px 20px' }}>Usuarios</th>
              <th style={{ padding: '12px 20px' }}>Fecha Alta</th>
              <th style={{ padding: '12px 20px', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr key={t.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                <td style={{ padding: '14px 20px', fontWeight: '700', color: '#111827' }}>{t.name}</td>
                <td style={{ padding: '14px 20px', fontFamily: 'monospace', color: '#4B5563' }}>{t.rfc}</td>
                <td style={{ padding: '14px 20px' }}>
                  <span
                    style={{
                      background: t.plan === 'professional' ? '#EFF6FF' : '#F3F4F6',
                      color: t.plan === 'professional' ? '#1D4ED8' : '#374151',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      textTransform: 'uppercase'
                    }}
                  >
                    {t.plan}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', color: '#111827', fontWeight: '600' }}>{t.locationsCount} sucursal(es)</td>
                <td style={{ padding: '14px 20px', color: '#111827' }}>{t.usersCount} usuarios</td>
                <td style={{ padding: '14px 20px', color: '#6B7280' }}>{t.createdAt}</td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <button
                    style={{
                      background: 'none',
                      border: '1px solid #D1D5DB',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                    onClick={() => alert(`Configuración de ${t.name}`)}
                  >
                    ⚙️ Gestionar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nueva Empresa */}
      {showNewTenantModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}>✨ Alta de Nueva Empresa Tenant</h3>
            <form onSubmit={handleCreateTenant}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  NOMBRE DE LA FERRETERÍA *
                </label>
                <input
                  type="text"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                  placeholder="Ej: Ferretera del Norte"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  RFC FISCAL *
                </label>
                <input
                  type="text"
                  value={newBusinessRfc}
                  onChange={(e) => setNewBusinessRfc(e.target.value)}
                  placeholder="Ej: FNO210405XYZ"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  CORREO DEL BUSINESS ADMIN *
                </label>
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="admin@ferreteria.com"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                  required
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '4px' }}>
                  PLAN DE SUSCRIPCIÓN *
                </label>
                <select
                  value={newBusinessPlan}
                  onChange={(e) => setNewBusinessPlan(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
                >
                  <option value="starter">Starter (1 Sucursal)</option>
                  <option value="professional">Professional (Hasta 5 Sucursales)</option>
                  <option value="enterprise">Enterprise (Ilimitadas)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowNewTenantModal(false)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#F97316', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
                >
                  Crear Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
