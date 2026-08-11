// Auth & Users
export interface User {
 id: string
 email: string
 name: string
 role: 'dueno' | 'vendedor' | 'cajero' | 'bodeguero' | 'chofer'
 businessId: string
 active?: boolean
 lastLogin?: Date
 createdAt?: Date
}

export interface Business {
 id: string
 name: string
 rfc: string
 plan: string
 requiresCajero?: boolean
 createdAt?: Date
}

export interface Location {
 id: string
 name: string
 clave: string
 address?: string
 businessId: string
 createdAt?: Date
}

// Products
export interface Product {
 id: string
 clave: string
 name: string
 category: string
 price: number
 costPrice: number
 margin?: number
 stock: number
 minStock?: number
 unit: string
 aisle?: string
 level?: string
 side?: string
 position?: string
 active?: boolean
 businessId: string
 locationId?: string
 image?: ProductImage
 supplier?: Supplier
}

export interface ProductImage {
 id: string
 name: string
 category: string
 imageUrl: string
}

export interface Supplier {
 id: string
 name: string
 contact?: string
 email?: string
 phone?: string
 address?: string
 businessId: string
 products?: Product[]
}

export interface StockMovement {
 id: string
 businessId: string
 productId: string
 type: 'entrada' | 'salida' | 'ajuste'
 qty: number
 reason?: string
 reference?: string
 createdAt: Date
 createdBy?: string
 product?: Product
}

// POS & Cart
export interface CartItem {
 productId: string
 clave: string
 name: string
 price: number
 qty: number
 subtotal: number
}

export interface POSFormData {
 clientName: string
 clientPhone: string
 deliveryType: 'mostrador' | 'domicilio'
 clientAddress: string
 paymentMethod: 'efectivo' | 'tarjeta' | 'transferencia' | 'credito'
 comprobante: 'completo' | 'resumido' | 'whatsapp' | 'sin_papel'
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
 clientPhone?: string
 clientAddress?: string
 deliveryType?: 'mostrador' | 'domicilio' | string
 paymentMethod?: 'efectivo' | 'tarjeta' | 'transferencia' | string
 comprobante?: 'completo' | 'resumido' | 'whatsapp' | 'sin' | string
 subtotal: number
 iva: number
 total: number
 status: 'pendiente' | 'pagada' | 'preparada' | 'entregada' | string
 paymentProcessedAt?: Date
 paidBy?: string
 createdAt: Date
 items?: SaleItem[]
 vendor?: {
 id: string
 name: string
 email: string
 }
}

export interface SaleItem {
 id: string
 saleId?: string
 productId: string
 qty: number
 price: number
 subtotal: number
 product?: Partial<Product> & { name: string; clave: string }
}

export interface PendingOrder extends Sale {
 items: SaleItem[]
 vendor: {
 id: string
 name: string
 email: string
 }
}

export interface Receipt {
 saleId: string
 paymentMethod: string
 timestamp: string
}

// Bodega
export interface SurtidoOrder {
 id: string
 businessId: string
 locationId: string
 saleId: string
 status: 'pendiente' | 'surtiendo' | 'listo' | 'completado' | string
 items: SurtidoItem[]
 sale?: Sale
 createdAt: Date
}

export interface SurtidoItem {
 id: string
 orderId: string
 productId: string
 qty: number
 qtyPicked?: number
 surtido: boolean
 product?: Product
}

// Entregas & Deliveries
export interface Delivery {
 id: string
 businessId: string
 locationId: string
 driverId: string
 saleId: string
 clientName: string
 clientPhone: string
 address: string
 latitude?: number
 longitude?: number
 lastLocationUpdate?: Date
 status: 'pendiente' | 'en_ruta' | 'completado' | 'cancelado' | string
 completedAt?: Date
 createdAt: Date
 driver?: User
 sale?: Sale
 items?: DeliveryItem[]
}

export interface DeliveryItem {
 id: string
 deliveryId: string
 productId: string
 qty: number
 product?: Product
}

// Compras & Proveedores
export interface PurchaseOrder {
 id: string
 businessId: string
 supplierId: string
 poNumber: string
 status: 'pendiente' | 'parcialmente_recibido' | 'completado' | 'cancelado' | string
 total: number
 reference?: string
 createdAt: Date
 supplier?: Supplier
 items?: PurchaseOrderItem[]
}

export interface PurchaseOrderItem {
 id: string
 orderId: string
 productId: string
 qty: number
 qtyReceived: number
 product?: Product
}

// Cash Close
export interface CashClose {
 id: string
 businessId: string
 locationId: string
 date: Date
 initialCash: number
 finalCash: number
 totalSales: number
 totalIngresos: number
 totalCosto: number
 margin: number
 difference: number
 status: 'cuadrado' | 'faltante' | 'sobrante' | string
 observations?: string
 createdAt: Date
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

// Facturación CFDI 4.0 (Mock / Sandbox)
export interface FacturaCFDI {
 id: string
 saleId: string
 uuid: string
 rfcEmisor: string
 rfcReceptor: string
 total: number
 xmlUrl: string
 pdfUrl: string
 status: 'timbrado' | 'cancelado' | 'simulado'
 createdAt: Date
}
