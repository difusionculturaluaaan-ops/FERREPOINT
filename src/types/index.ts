// Auth & Users
export interface User {
  id: string
  email: string
  name: string
  role: 'dueno' | 'vendedor' | 'cajero' | 'bodeguero' | 'chofer'
  businessId: string
}

export interface Business {
  id: string
  name: string
  rfc: string
  plan: string
}

export interface Location {
  id: string
  name: string
  clave: string
  businessId: string
}

// Products
export interface Product {
  id: string
  clave: string
  name: string
  category: string
  price: number
  stock: number
  minStock: number
  unit: string
  businessId: string
  locationId?: string
}

// Sales
export interface Sale {
  id: string
  folio: string
  businessId: string
  locationId: string
  vendorId: string
  clientName?: string
  clientRfc?: string
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Crédito'
  comprobante: 'completo' | 'resumido' | 'whatsapp' | 'sin'
  subtotal: number
  iva: number
  total: number
  items: SaleItem[]
  createdAt: Date
}

export interface SaleItem {
  id: string
  productId: string
  qty: number
  price: number
  subtotal: number
  product?: Product
}

// Bodega
export interface SurtidoOrder {
  id: string
  businessId: string
  locationId: string
  saleId: string
  status: 'pendiente' | 'surtiendo' | 'listo'
  items: SurtidoItem[]
  createdAt: Date
}

export interface SurtidoItem {
  id: string
  orderId: string
  productId: string
  qty: number
  surtido: boolean
  product?: Product
}

// Reports
export interface DailyReport {
  salesCount: number
  totalIngresos: number
  deliveriesActive: number
  avgTicket: number
  byVendor: VendorReport[]
}

export interface VendorReport {
  vendorId: string
  vendorName: string
  total: number
  count: number
}
