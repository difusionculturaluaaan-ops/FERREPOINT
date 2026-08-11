'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { actionGetTenants, actionCreateTenant, actionUpdateTenantModules } from '@/features/auth/server';

interface Tenant {
 id: string;
 name: string;
 rfc: string;
 plan: string;
 requiresCajero: boolean;
 enabledModules: string[];
 locationsCount: number;
 usersCount: number;
 createdAt: string;
}

const ALL_MODULES = [
 { key: 'pos', label: ' Punto de Venta (POS)', desc: 'Ventas, tickets y comprobantes WhatsApp' },
 { key: 'inventario', label: ' Gestión de Inventario', desc: 'Catálogo de productos, familias y stock' },
 { key: 'caja', label: ' Caja & Cobros', desc: 'Cobro de órdenes y corte de caja diario' },
 { key: 'bodega', label: ' Bodega & Surtido', desc: 'Ordenes de surtido organizadas por pasillos' },
 { key: 'entregas', label: ' Entregas & Choferes', desc: 'Despacho a domicilio y control de choferes' },
 { key: 'compras', label: ' Compras & Proveedores', desc: 'Órdenes de compra y recepción de insumos' },
 { key: 'contabilidad', label: ' Contabilidad & Márgenes', desc: 'Estado de resultados y utilidades brutas' },
 { key: 'cxc', label: ' Créditos & CxC', desc: 'Ventas fiadas y abonos de clientes' },
 { key: 'facturacion', label: ' Facturación CFDI 4.0', desc: 'Integración fiscal y timbrado' },
];

export default function SuperAdminPage() {
 const [tenants, setTenants] = useState<Tenant[]>([]);
 const [loading, setLoading] = useState(true);
 const [showNewModal, setShowNewModal] = useState(false);
 const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
 const [showModulesModal, setShowModulesModal] = useState(false);

 // Form states
 const [newBusinessName, setNewBusinessName] = useState('');
 const [newBusinessRfc, setNewBusinessRfc] = useState('');
 const [newBusinessPlan, setNewBusinessPlan] = useState('professional');
 const [adminEmail, setAdminEmail] = useState('');
 const [selectedModules, setSelectedModules] = useState<string[]>([
 'pos', 'inventario', 'caja', 'bodega', 'entregas', 'compras', 'contabilidad', 'cxc', 'facturacion'
 ]);
 const [toast, setToast] = useState('');
 const [createdPasswordModal, setCreatedPasswordModal] = useState<{ email: string; pass: string } | null>(null);

 useEffect(() => {
 loadTenants();
 }, []);

 const loadTenants = async () => {
 setLoading(true);
 const data = await actionGetTenants();
 setTenants(data);
 setLoading(false);
 };

 const toggleModuleSelection = (modKey: string) => {
 if (modKey === 'pos') return; // POS siempre activo
 if (selectedModules.includes(modKey)) {
 setSelectedModules(selectedModules.filter(m => m !== modKey));
 } else {
 setSelectedModules([...selectedModules, modKey]);
 }
 };

 const handleCreateTenant = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!newBusinessName.trim() || !newBusinessRfc.trim() || !adminEmail.trim()) return;

 const res = await actionCreateTenant(
 newBusinessName,
 newBusinessRfc,
 newBusinessPlan,
 selectedModules,
 adminEmail
 );

 if (res.success && res.plainPassword) {
 setCreatedPasswordModal({ email: res.adminEmail || adminEmail, pass: res.plainPassword });
 setNewBusinessName('');
 setNewBusinessRfc('');
 setAdminEmail('');
 setShowNewModal(false);
 await loadTenants();
 } else {
 alert(res.error || 'Error al crear la empresa');
 }
 };

 const handleOpenModulesConfig = (tenant: Tenant) => {
 setSelectedTenant(tenant);
 setSelectedModules(tenant.enabledModules || ['pos', 'inventario']);
 setShowModulesModal(true);
 };

 const handleSaveModules = async () => {
 if (!selectedTenant) return;
 const res = await actionUpdateTenantModules(selectedTenant.id, selectedModules);
 if (res.success) {
 setToast(`Módulos de ${selectedTenant.name} actualizados`);
 setShowModulesModal(false);
 setSelectedTenant(null);
 await loadTenants();
 } else {
 alert(res.error || 'Error al actualizar módulos');
 }
 };

 if (toast) {
 setTimeout(() => setToast(''), 3500);
 }

 return (
 <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
 <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
 <div>
 <h1 style={{ fontSize: '26px', fontWeight: '900', color: '#111827', margin: 0 }}>
 PANEL GLOBAL SUPER ADMIN — FERREPOINT SaaS
 </h1>
 <p style={{ color: '#6B7280', fontSize: '14px', margin: '4px 0 0' }}>
 Gestión Multitenant de empresas clientes y activación modular de procesos
 </p>
 </div>
 <div style={{ display: 'flex', gap: '12px' }}>
 <button
 onClick={() => {
 setSelectedModules(['pos', 'inventario', 'caja', 'bodega', 'entregas', 'compras', 'contabilidad', 'cxc', 'facturacion']);
 setShowNewModal(true);
 }}
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
 Facturación Mensual
 </div>
 <div style={{ fontSize: '32px', fontWeight: '900', color: '#8B5CF6', marginTop: '4px' }}>
 ${tenants.length * 1499}
 </div>
 <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '4px' }}>MXN / mes estimado</div>
 </div>
 </div>

 {/* Tabla de Empresas Tenants */}
 <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #E5E7EB', overflow: 'hidden' }}>
 <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>
 Empresas Registradas (Tenants SaaS)
 </h3>
 <span style={{ fontSize: '12px', color: '#6B7280' }}>Mostrando {tenants.length} registros</span>
 </div>

 {loading ? (
 <div style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>Cargando empresas...</div>
 ) : (
 <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
 <thead>
 <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB', color: '#4B5563', fontSize: '12px', textTransform: 'uppercase' }}>
 <th style={{ padding: '12px 20px' }}>Empresa Ferretera</th>
 <th style={{ padding: '12px 20px' }}>RFC</th>
 <th style={{ padding: '12px 20px' }}>Plan</th>
 <th style={{ padding: '12px 20px' }}>Módulos Habilitados</th>
 <th style={{ padding: '12px 20px' }}>Sucursales</th>
 <th style={{ padding: '12px 20px' }}>Usuarios</th>
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
 background: '#EFF6FF',
 color: '#1D4ED8',
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
 <td style={{ padding: '14px 20px' }}>
 <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '300px' }}>
 {(t.enabledModules || ['pos', 'inventario']).map((m) => (
 <span
 key={m}
 style={{
 background: '#F3F4F6',
 color: '#374151',
 fontSize: '11px',
 fontWeight: '600',
 padding: '2px 7px',
 borderRadius: '4px'
 }}
 >
 {m}
 </span>
 ))}
 </div>
 </td>
 <td style={{ padding: '14px 20px', color: '#111827', fontWeight: '600' }}>{t.locationsCount} sucursal(es)</td>
 <td style={{ padding: '14px 20px', color: '#111827' }}>{t.usersCount} usuarios</td>
 <td style={{ padding: '14px 20px', textAlign: 'right' }}>
 <button
 style={{
 background: '#FFF0E6',
 color: '#F97316',
 border: '1px solid #F97316',
 padding: '6px 12px',
 borderRadius: '6px',
 fontSize: '12px',
 fontWeight: '700',
 cursor: 'pointer'
 }}
 onClick={() => handleOpenModulesConfig(t)}
 >
 ️ Modificar Módulos
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 )}
 </div>

 {/* Modal Nueva Empresa */}
 {showNewModal && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
 <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
 <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: '800' }}> Alta de Nueva Empresa Tenant</h3>
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

 {/* SELECTOR DE MÓDULOS ACTIVOS */}
 <div style={{ marginBottom: '20px' }}>
 <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>
 MÓDULOS Y PROCESOS HABILITADOS PARA ESTE CLIENTE *
 </label>
 <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', background: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
 {ALL_MODULES.map((m) => (
 <label
 key={m.key}
 style={{
 display: 'flex',
 alignItems: 'flex-start',
 gap: '10px',
 cursor: m.key === 'pos' ? 'not-allowed' : 'pointer',
 padding: '6px 8px',
 borderRadius: '6px',
 background: selectedModules.includes(m.key) ? '#FFF0E6' : 'transparent'
 }}
 >
 <input
 type="checkbox"
 checked={selectedModules.includes(m.key)}
 disabled={m.key === 'pos'}
 onChange={() => toggleModuleSelection(m.key)}
 style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
 />
 <div>
 <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>{m.label}</div>
 <div style={{ fontSize: '11px', color: '#6B7280' }}>{m.desc}</div>
 </div>
 </label>
 ))}
 </div>
 </div>

 <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
 <button
 type="button"
 onClick={() => setShowNewModal(false)}
 style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer' }}
 >
 Cancelar
 </button>
 <button
 type="submit"
 style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#F97316', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
 >
 Crear Empresa Client
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Modal Modificar Módulos */}
 {showModulesModal && selectedTenant && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
 <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
 <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '800' }}>
 ️ Personalizar Módulos de {selectedTenant.name}
 </h3>
 <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7280' }}>
 Activa o desactiva procesos según la suscripción de tu cliente:
 </p>

 <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', background: '#F9FAFB', padding: '12px', borderRadius: '8px', border: '1px solid #E5E7EB', marginBottom: '20px' }}>
 {ALL_MODULES.map((m) => (
 <label
 key={m.key}
 style={{
 display: 'flex',
 alignItems: 'flex-start',
 gap: '10px',
 cursor: m.key === 'pos' ? 'not-allowed' : 'pointer',
 padding: '6px 8px',
 borderRadius: '6px',
 background: selectedModules.includes(m.key) ? '#FFF0E6' : 'transparent'
 }}
 >
 <input
 type="checkbox"
 checked={selectedModules.includes(m.key)}
 disabled={m.key === 'pos'}
 onChange={() => toggleModuleSelection(m.key)}
 style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer' }}
 />
 <div>
 <div style={{ fontSize: '13px', fontWeight: '700', color: '#111827' }}>{m.label}</div>
 <div style={{ fontSize: '11px', color: '#6B7280' }}>{m.desc}</div>
 </div>
 </label>
 ))}
 </div>

 <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
 <button
 type="button"
 onClick={() => setShowModulesModal(false)}
 style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer' }}
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={handleSaveModules}
 style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#F97316', color: '#fff', fontWeight: '700', cursor: 'pointer' }}
 >
 Guardar Módulos
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Password Modal al crear tenant */}
 {createdPasswordModal && (
 <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
 <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '420px', textAlign: 'center' }}>
 <div style={{ fontSize: '42px', marginBottom: '8px' }}></div>
 <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: '800' }}>Empresa Creada Exitosamente</h3>
 <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 16px' }}>
 Credenciales iniciales para el Business Admin (<strong>{createdPasswordModal.email}</strong>):
 </p>

 <div style={{ background: '#FFF0E6', border: '2px solid #F97316', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', fontWeight: '800', fontSize: '18px', color: '#F97316', marginBottom: '16px' }}>
 {createdPasswordModal.pass}
 </div>

 <button
 onClick={() => {
 navigator.clipboard.writeText(createdPasswordModal.pass);
 alert('Contraseña copiada al portapapeles');
 }}
 style={{ width: '100%', padding: '10px', background: '#F3F4F6', border: '1px solid #D1D5DB', borderRadius: '8px', fontWeight: '600', marginBottom: '8px', cursor: 'pointer' }}
 >
 Copiar Contraseña
 </button>
 <button
 onClick={() => setCreatedPasswordModal(null)}
 style={{ width: '100%', padding: '10px', background: '#F97316', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' }}
 >
 Listo
 </button>
 </div>
 </div>
 )}

 {/* Toast */}
 {toast && (
 <div style={{ position: 'fixed', bottom: '20px', right: '20px', background: '#10B981', color: '#fff', padding: '12px 20px', borderRadius: '8px', fontWeight: '700', fontSize: '14px', zIndex: 2000 }}>
 {toast}
 </div>
 )}
 </div>
 );
}
