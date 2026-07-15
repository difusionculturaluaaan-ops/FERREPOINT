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
      facturacion: false
    }
  },
  professional: {
    name: "Plan Profesional",
    price: 299,
    modules: ["pos", "bodega", "inventario", "reportes"],
    maxUsers: 10,
    maxLocations: 3,
    features: {
      pos: true,
      bodega: true,
      inventario: true,
      reportes: true,
      entregas: false,
      contabilidad: false,
      facturacion: false
    }
  },
  enterprise: {
    name: "Plan Empresarial",
    price: 999,
    modules: ["pos", "bodega", "inventario", "reportes", "entregas", "contabilidad", "facturacion"],
    maxUsers: 999,
    maxLocations: 999,
    features: {
      pos: true,
      bodega: true,
      inventario: true,
      reportes: true,
      entregas: true,
      contabilidad: true,
      facturacion: true
    }
  }
};

export type PlanType = keyof typeof PLANS;

export function getPlanByName(planName: string): PlanType {
  if (PLANS[planName as PlanType]) {
    return planName as PlanType;
  }
  return "free"; // Default
}

export function hasFeature(plan: string, feature: string): boolean {
  const planType = getPlanByName(plan);
  return PLANS[planType].features[feature as keyof typeof PLANS["free"]["features"]] || false;
}

export function canAccessModule(plan: string, module: string): boolean {
  const planType = getPlanByName(plan);
  return PLANS[planType].modules.includes(module);
}
