import { prisma } from '@/lib/prisma'

export const DEFAULT_HARDWARE_PRODUCTS = [
  {
    clave: '40-09-0109-607',
    name: 'Estuco Premium 20 KG',
    category: 'Acabados',
    costPrice: 85.0,
    price: 145.0,
    stock: 150,
    minStock: 10,
    unit: 'pieza',
    aisle: 'P01',
    level: 'N2',
    side: 'DER',
    position: 'Pos 1'
  },
  {
    clave: '40-09-0310-401',
    name: 'Pintura Vinílica Blanco 4L',
    category: 'Pintura',
    costPrice: 95.0,
    price: 165.0,
    stock: 85,
    minStock: 8,
    unit: 'pieza',
    aisle: 'P02',
    level: 'N3',
    side: 'IZQ',
    position: 'Pos 2'
  },
  {
    clave: '75-27-1700-007',
    name: 'Tornillo Tirafondo 5/16" X 4"',
    category: 'Tornillería',
    costPrice: 2.5,
    price: 5.0,
    stock: 2000,
    minStock: 100,
    unit: 'pieza',
    aisle: 'P03',
    level: 'N1',
    side: 'DER',
    position: 'Pos 1'
  },
  {
    clave: '75-19-5100-007',
    name: 'Clavo 3" Cabeza Perdida',
    category: 'Clavería',
    costPrice: 1.0,
    price: 2.0,
    stock: 5000,
    minStock: 200,
    unit: 'kg',
    aisle: 'P04',
    level: 'N2',
    side: 'IZQ',
    position: 'Pos 3'
  },
  {
    clave: '46-00-9900-002',
    name: 'Destornillador Phillips #2 Truper',
    category: 'Herramientas',
    costPrice: 15.0,
    price: 28.0,
    stock: 45,
    minStock: 5,
    unit: 'pieza',
    aisle: 'P05',
    level: 'N1',
    side: 'DER',
    position: 'Pos 2'
  },
  {
    clave: '30-02-0200-108',
    name: 'Tubo PVC 3/4" X 3M',
    category: 'Plomería',
    costPrice: 45.0,
    price: 85.0,
    stock: 120,
    minStock: 15,
    unit: 'pieza',
    aisle: 'P06',
    level: 'N2',
    side: 'DER',
    position: 'Pos 4'
  },
  {
    clave: '30-02-0300-003',
    name: 'Llave de Paso 1/2"',
    category: 'Plomería',
    costPrice: 32.0,
    price: 58.0,
    stock: 95,
    minStock: 10,
    unit: 'pieza',
    aisle: 'P07',
    level: 'N1',
    side: 'IZQ',
    position: 'Pos 1'
  },
  {
    clave: '81-03-0103-001',
    name: 'Cemento Gris 50KG',
    category: 'Materiales de Construcción',
    costPrice: 125.0,
    price: 189.0,
    stock: 100,
    minStock: 20,
    unit: 'pieza',
    aisle: 'P08',
    level: 'N1',
    side: 'DER',
    position: 'Pos 1'
  },
  {
    clave: '70-01-0001-500',
    name: 'Pala Cuadrada Truper Mango Fibra',
    category: 'Herramientas',
    costPrice: 110.0,
    price: 224.14,
    stock: 15,
    minStock: 4,
    unit: 'pieza',
    aisle: 'P05',
    level: 'N2',
    side: 'IZQ',
    position: 'Pos 1'
  },
  {
    clave: '50-02-0003-200',
    name: 'Impermeabilizante Fibratado 19L',
    category: 'Pintura',
    costPrice: 450.0,
    price: 775.86,
    stock: 10,
    minStock: 3,
    unit: 'pieza',
    aisle: 'P02',
    level: 'N1',
    side: 'DER',
    position: 'Pos 1'
  },
  {
    clave: '30-03-0002-800',
    name: 'Malla Electrosoldada 6x6 2.5x40M',
    category: 'Acero',
    costPrice: 180.0,
    price: 310.34,
    stock: 25,
    minStock: 5,
    unit: 'rollo',
    aisle: 'P09',
    level: 'N1',
    side: 'DER',
    position: 'Pos 1'
  },
  {
    clave: '20-05-0002-100',
    name: 'Tabique Rojo 6x12x24 cm',
    category: 'Block',
    costPrice: 1.80,
    price: 3.45,
    stock: 1500,
    minStock: 200,
    unit: 'millar',
    aisle: 'PATIO',
    level: 'P1',
    side: 'NORTE',
    position: 'Pos 1'
  }
]

export async function seedTenantDefaultCatalog(businessId: string, locationId?: string) {
  try {
    const existingCount = await prisma.product.count({
      where: { businessId }
    })

    if (existingCount > 0) {
      return { seeded: false, count: existingCount }
    }

    const defaultLocation = locationId || (await prisma.location.findFirst({ where: { businessId } }))?.id

    const dataToInsert = DEFAULT_HARDWARE_PRODUCTS.map(p => {
      const margin = p.price > 0 ? ((p.price - p.costPrice) / p.price) * 100 : 0
      return {
        businessId,
        ...(defaultLocation && { locationId: defaultLocation }),
        clave: p.clave,
        name: p.name,
        category: p.category,
        costPrice: p.costPrice,
        price: p.price,
        margin: parseFloat(margin.toFixed(2)),
        stock: p.stock,
        minStock: p.minStock,
        unit: p.unit,
        aisle: p.aisle,
        level: p.level,
        side: p.side,
        position: p.position,
        active: true
      }
    })

    await prisma.product.createMany({
      data: dataToInsert,
      skipDuplicates: true
    })

    console.log(`[seedTenantDefaultCatalog] Seeded ${dataToInsert.length} default hardware products for tenant ${businessId}`)
    return { seeded: true, count: dataToInsert.length }
  } catch (error) {
    console.error('Error seeding default tenant catalog:', error)
    return { seeded: false, count: 0 }
  }
}
