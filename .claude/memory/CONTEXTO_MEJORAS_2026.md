# Contexto de Mejoras y Registro de Cambios — FERREPOINT (Agosto 2026)

## 📌 Resumen de Trabajos Realizados

### 1. Centralización de Tipos TypeScript
- Se enriqueció y unificó la definición de interfaces en `src/types/index.ts` (`Sale`, `PendingOrder`, `SurtidoOrder`, `CartItem`, `POSFormData`, `Delivery`, `PurchaseOrder`, `CashClose`, `FacturaCFDI`).
- Se eliminaron redundancias locales en componentes y vistas de la app (`/pos`, `/caja`, `/bodega`, `/inventario`, `/reportes`, `/entregas`, `/contabilidad`, `/compras`, `/almacen`, `/admin`).

### 2. Notificaciones en Tiempo Real (Server-Sent Events)
- **Bus Global**: `src/lib/eventEmitter.ts` emite eventos (`ORDER_CREATED`, `ORDER_PAID`, `SURTIDO_UPDATED`).
- **Endpoint Streaming**: `src/app/api/events/route.ts` expone SSE nativo por `businessId`.
- **Hook React**: `src/hooks/useRealtimeEvents.ts` permite actualizar tableros en vivo (Caja, Bodega, Vendedor) de forma reactiva sin refrescar la página.

### 3. Entorno de Pruebas Locales CFDI 4.0 (Sandbox)
- **Servicio Mock**: `src/lib/facturama.ts` simula el timbrado fiscal de facturas CFDI 4.0 (XML v4.0, Sellos SAT, UUID, QR y desglose de IVA).
- **Server Action**: `src/features/facturacion/server.ts` con `actionGenerateFactura`.
- **Script de Pruebas**: `test-cfdi-sandbox.js` ejecutable mediante `node test-cfdi-sandbox.js`.

### 4. Navegación Global (Navegación Dueño)
- **Componente**: `src/components/DashboardButton.tsx` (`🏠 Panel Principal`).
- Implementado en las barras superiores (Header) de todos los módulos (`/pos`, `/caja`, `/bodega`, `/inventario`, `/reportes`, `/entregas`, `/contabilidad`, `/compras`, `/almacen`, `/admin`).

### 5. Optimización UI Carrito POS & Modal Flotante
- **Barra Lateral**: Removida la restricción de altura `maxHeight: 35%`. Ajustado el envolvente de nombres de productos (`wordBreak: break-word`).
- **Ventana Flotante Modal**: Se agregó el botón **`🔍 Ver Detallado`** que abre un modal amplio (850px) para carritos de gran escala con:
  - Buscador de productos dentro del carrito.
  - Tabla completa con claves, precios unitarios, controles de cantidad `− / +` y eliminación.
  - Vaciado de carrito en 1 clic.
  - Botón directo para **`💳 IR A COBRAR`**.
