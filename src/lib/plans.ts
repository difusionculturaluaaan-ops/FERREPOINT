// Plan definitions - Feature gating by subscription tier
export const PLANS = {
  free: {
    name: "Plan Gratis",
    price: 0,
    modules: ["pos"],
    maxUsers: 3,
    maxLocations: 1,
    features: {
      pos: true,
      bodega: false,
      inventario: false,
      reportes: false,
      entregas: false,
      contabilidad: false,
      facturacion: false,
      cxc: false
    }
  },
  starter: {
    name: "Plan Inicial (Starter)",
    price: 499,
    modules: ["pos", "bodega", "inventario", "caja", "reportes", "entregas", "compras", "contabilidad", "facturacion", "cxc"],
    maxUsers: 10,
    maxLocations: 2,
    features: {
      pos: true,
      bodega: true,
      inventario: true,
      reportes: true,
      entregas: true,
      contabilidad: true,
      facturacion: true,
      cxc: true
    }
  },
  professional: {
    name: "Plan Profesional",
    price: 299,
    modules: ["pos", "bodega", "inventario", "caja", "reportes", "entregas", "compras", "contabilidad", "facturacion", "cxc"],
    maxUsers: 10,
    maxLocations: 3,
    features: {
      pos: true,
      bodega: true,
      inventario: true,
      reportes: true,
      entregas: true,
      contabilidad: true,
      facturacion: true,
      cxc: true
    }
  },
  enterprise: {
    name: "Plan Empresarial",
    price: 999,
    modules: ["pos", "bodega", "inventario", "caja", "reportes", "entregas", "compras", "contabilidad", "facturacion", "cxc"],
    maxUsers: 999,
    maxLocations: 999,
    features: {
      pos: true,
      bodega: true,
      inventario: true,
      reportes: true,
      entregas: true,
      contabilidad: true,
      facturacion: true,
      cxc: true
    }
  }
};

export type PlanType = keyof typeof PLANS;

export const MODULE_DETAILS: Record<string, { label: string; icon: string; desc: string }> = {
  pos: { label: 'Punto de Venta (POS)', icon: '🛒', desc: 'Ventas rápidas en mostrador, tickets térmicos y comprobantes WhatsApp' },
  inventario: { label: 'Gestión de Inventario', icon: '📦', desc: 'Catálogo de productos, familias, stock mínimo y ubicaciones' },
  caja: { label: 'Caja & Cobros', icon: '💵', desc: 'Recepción de pagos, cobros en tiempo real e historial de turnos' },
  bodega: { label: 'Bodega & Surtido', icon: '🏗️', desc: 'Preparación visual de órdenes de surtido organizadas por pasillos' },
  almacen: { label: 'Almacén & Kardex', icon: '🏭', desc: 'Entradas, salidas, ajustes de stock e historial de movimientos' },
  compras: { label: 'Compras & Proveedores', icon: '🚚', desc: 'Órdenes de compra a proveedores y recepción automática de mercancía' },
  contabilidad: { label: 'Contabilidad & Márgenes', icon: '📊', desc: 'Estado de Resultados, Utilidad Bruta y Calculadora de Arqueo' },
  entregas: { label: 'Entregas & Choferes', icon: '🗺️', desc: 'Despacho a domicilio, Kanban de rutas y control de choferes' },
  cxc: { label: 'Créditos & CxC', icon: '💳', desc: 'Ventas fiadas a crédito, control de plazos y abonos de clientes' },
  facturacion: { label: 'Facturación CFDI 4.0', icon: '🧾', desc: 'Timbrado fiscal SAT, generación de XML v4.0 y PDF de facturas' }
};

export function getPlanByName(planName: string): PlanType {
  if (PLANS[planName as PlanType]) {
    return planName as PlanType;
  }
  return "starter";
}

export function hasFeature(plan: string, feature: string): boolean {
  const planType = getPlanByName(plan);
  return PLANS[planType].features[feature as keyof typeof PLANS["free"]["features"]] || false;
}

export function canAccessModule(plan: string, module: string): boolean {
  const planType = getPlanByName(plan);
  return PLANS[planType].modules.includes(module);
}
