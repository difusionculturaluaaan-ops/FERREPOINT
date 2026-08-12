'use client';

import { useState, useEffect, useCallback } from 'react';
import { FeatureGate } from '@/components/FeatureGate';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LogoutButton } from '@/components/LogoutButton';
import { DashboardButton } from '@/components/DashboardButton';
import { actionGetOrdersForWarehouse, actionMarkOrderAsReady } from '@/features/pos/server';
import { actionGetSurtidoOrders, actionCompleteSurtidoOrder, actionGetBodegaStats } from '@/features/bodega/server';
import { useRealtimeEvents } from '@/hooks/useRealtimeEvents';

import { UserProfileBadge } from '@/components/UserProfileBadge';

interface WareHouseOrder {
 id: string;
 folio: string;
 clientName?: string;
 deliveryType?: string;
 status: string;
 createdAt: Date;
 items: {
 id: string;
 qty: number;
 subtotal: number;
 product: {
 id: string;
 name: string;
 clave: string;
 aisle?: string;
 level?: string;
 side?: string;
 };
 }[];
 vendor?: {
 name: string;
 };
}

export default function BodegaPage() {
 const [orders, setOrders] = useState<WareHouseOrder[]>([]);
 const [checkedItems, setCheckedItems] = useState<{ [itemId: string]: boolean }>({});
 const [stats, setStats] = useState({ pending: 0, completed: 0, total: 0, inProgress: 0 });
 const [loading, setLoading] = useState(true);
 const [businessId, setBusinessId] = useState('');
 const [locationId, setLocationId] = useState('');
 const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
 const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

 const showToast = useCallback((message: string, type: 'success' | 'error') => {
 setToast({ message, type });
 setTimeout(() => setToast(null), 4000);
 }, []);

 const loadData = useCallback(async () => {
 if (!businessId) return;
 try {
 setLoading(true);
 const data = await actionGetOrdersForWarehouse(businessId);
 setOrders(data as any);
 setStats({
 pending: data.filter((o: any) => o.status === 'pendiente').length,
 inProgress: data.filter((o: any) => o.status === 'en_proceso').length,
 completed: data.filter((o: any) => o.status === 'completado').length,
 total: data.length
 });
 } catch (err) {
 console.error('Error loading warehouse data:', err);
 } finally {
 setLoading(false);
 }
 }, [businessId]);

 useEffect(() => {
 const biz = localStorage.getItem('businessId');
 const loc = localStorage.getItem('locationId') || '';
 if (biz) setBusinessId(biz);
 if (loc) setLocationId(loc);
 }, []);

 useEffect(() => {
 if (businessId) {
 loadData();
 }
 }, [businessId, loadData]);

 // Real-time events connection
 useRealtimeEvents(businessId, useCallback((event) => {
 if (event.type === 'ORDER_PAID' || event.type === 'SURTIDO_UPDATED') {
 showToast(` Nueva orden lista para surtir: Folio #${event.data.folio}`, 'success');
 loadData();
 }
 }, [businessId, loadData, showToast]));

 const toggleItemCheck = (itemId: string) => {
 setCheckedItems(prev => ({
 ...prev,
 [itemId]: !prev[itemId]
 }));
 };

 const handleCompleteOrder = async (orderId: string, folio: string) => {
 try {
 const res = await actionMarkOrderAsReady(orderId);
 if (res.success) {
 showToast(` Orden #${folio} completada y lista para entrega`, 'success');
 loadData();
 } else {
 showToast(res.error || 'Error al completar orden', 'error');
 }
 } catch (err) {
 console.error('Error completing order:', err);
 showToast('Error al completar orden', 'error');
 }
 };

 const handleChangeOrderStatus = async (orderId: string, newStatus: 'pendiente' | 'en_proceso' | 'completado', folio: string) => {
 try {
 // Update order status in surtidoOrder
 const res = await actionCompleteSurtidoOrder(orderId); // TODO: crear actionUpdateSurtidoOrderStatus
 if (res.success) {
 const statusLabel = { pendiente: ' Pendiente', en_proceso: ' En Preparación', completado: ' Listo' }[newStatus] || newStatus;
 showToast(` Orden #${folio} → ${statusLabel}`, 'success');
 loadData();
 }
 } catch (err) {
 console.error('Error changing order status:', err);
 }
 };

 // Filter orders by status
 const ordersByStatus = {
 pendiente: orders.filter(o => o.status === 'pendiente'),
 en_proceso: orders.filter(o => o.status === 'en_proceso'),
 completado: orders.filter(o => o.status === 'completado')
 };

 return (
 <FeatureGate feature="bodega">
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
 <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent-orange)' }}>
 Módulo de Bodega & Surtido
 </h1>
 <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
 Preparación de órdenes y ubicación visual por pasillos
 </p>
 </div>
 <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
 <UserProfileBadge />
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
 backgroundColor: toast.type === 'success' ? 'var(--accent-green, #10b981)' : 'var(--accent-red, #ef4444)',
 color: 'white',
 borderRadius: '0.5rem',
 zIndex: 50,
 fontSize: '0.875rem',
 fontWeight: '500',
 boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
 }}
 >
 {toast.message}
 </div>
 )}

 {/* Main Layout */}
 <div style={{ padding: '1.5rem 1rem', maxWidth: '1400px', margin: '0 auto' }}>
 {/* KPI Stats Grid */}
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
 <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}> Órdenes por Surtir</div>
 <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--accent-orange)', marginTop: '0.25rem' }}>{stats.pending}</div>
 </div>
 <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}> Ubicaciones Registradas</div>
 <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)', marginTop: '0.25rem' }}>12 Pasillos</div>
 </div>
 <div style={{ padding: '1.25rem', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.75rem', border: '1px solid var(--border-color)' }}>
 <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}> Conexión SSE</div>
 <div style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--accent-green, #10b981)', marginTop: '0.5rem' }}> En Tiempo Real</div>
 </div>
 </div>

 {/* Orders Section */}
 <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
 Lista de Órdenes a Preparar ({orders.length})
 </h2>

 {loading ? (
 <div style={{ padding: '3rem', textAlign: 'center', backgroundColor: 'var(--bg-secondary)', borderRadius: '0.5rem', color: 'var(--text-secondary)' }}>
 Cargando órdenes de bodega...
 </div>
 ) : orders.length === 0 ? (
 <div
 style={{
 padding: '3rem',
 backgroundColor: 'var(--bg-secondary)',
 borderRadius: '0.5rem',
 textAlign: 'center',
 border: '1px dashed var(--border-color)',
 color: 'var(--text-secondary)',
 }}
 >
 ¡No hay órdenes pendientes de surtido en este momento!
 </div>
 ) : (
 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
 {orders.map((ord) => {
 const totalItemsCount = ord.items.length;
 const pickedItemsCount = ord.items.filter(i => checkedItems[i.id]).length;
 const progressPercent = totalItemsCount > 0 ? Math.round((pickedItemsCount / totalItemsCount) * 100) : 0;

 return (
 <div
 key={ord.id}
 style={{
 backgroundColor: 'var(--bg-secondary)',
 borderRadius: '0.75rem',
 border: '1.5px solid var(--border-color)',
 overflow: 'hidden',
 display: 'flex',
 flexDirection: 'column'
 }}
 >
 {/* Order Header */}
 <div style={{ padding: '1rem 1.25rem', backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.03))', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
 <div>
 <span style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--accent-orange)' }}>Folio #{ord.folio}</span>
 <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}> {ord.clientName || 'Cliente'}</div>
 </div>
 <span style={{ backgroundColor: ord.deliveryType === 'domicilio' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)', color: ord.deliveryType === 'domicilio' ? '#3b82f6' : '#10b981', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '700' }}>
 {ord.deliveryType === 'domicilio' ? ' Domicilio' : ' Mostrador'}
 </span>
 </div>

 {/* Progress Bar */}
 <div style={{ height: '4px', backgroundColor: 'var(--border-color)', width: '100%' }}>
 <div style={{ height: '100%', backgroundColor: 'var(--accent-orange)', width: `${progressPercent}%`, transition: 'width 0.3s ease' }} />
 </div>

 {/* Checklist of Items */}
 <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
 <div style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
 Checklist de Ubicaciones ({pickedItemsCount}/{totalItemsCount})
 </div>

 {ord.items.map((item) => {
 const isChecked = !!checkedItems[item.id];
 const aisleTag = item.product?.aisle || 'P01';
 const levelTag = item.product?.level || 'N1';

 return (
 <div
 key={item.id}
 onClick={() => toggleItemCheck(item.id)}
 style={{
 display: 'flex',
 alignItems: 'center',
 gap: '0.75rem',
 padding: '0.65rem 0.75rem',
 backgroundColor: isChecked ? 'rgba(16, 185, 129, 0.08)' : 'var(--bg-primary)',
 border: `1px solid ${isChecked ? '#10b981' : 'var(--border-color)'}`,
 borderRadius: '0.5rem',
 cursor: 'pointer',
 transition: 'all 0.2s ease'
 }}
 >
 <input
 type="checkbox"
 checked={isChecked}
 onChange={() => {}}
 style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-orange)' }}
 />
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ fontSize: '0.9rem', fontWeight: '600', textDecoration: isChecked ? 'line-through' : 'none', opacity: isChecked ? 0.7 : 1 }}>
 {item.qty}x {item.product?.name || 'Producto'}
 </div>
 <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
 Clave: {item.product?.clave || 'N/A'}
 </div>
 </div>
 <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
 <span style={{ backgroundColor: 'var(--accent-orange)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
 {aisleTag}-{levelTag}
 </span>
 </div>
 </div>
 );
 })}
 </div>

 {/* Footer Action */}
 <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)' }}>
 <button
 onClick={() => handleCompleteOrder(ord.id, ord.folio)}
 style={{
 width: '100%',
 padding: '0.75rem',
 backgroundColor: progressPercent === 100 ? 'var(--accent-green, #10b981)' : 'var(--accent-orange)',
 color: 'white',
 border: 'none',
 borderRadius: '0.5rem',
 fontWeight: '700',
 fontSize: '0.95rem',
 cursor: 'pointer',
 transition: 'background 0.2s ease'
 }}
 >
 {progressPercent === 100 ? ' COMPLETAR SURTIDO (100%)' : ` MARCAR COMO COMPLETADO (${progressPercent}%)`}
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </div>
 </FeatureGate>
 );
}
