import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Limpiar datos previos
  await prisma.deliveryItem.deleteMany()
  await prisma.delivery.deleteMany()
  await prisma.cashClose.deleteMany()
  await prisma.surtidoItem.deleteMany()
  await prisma.surtidoOrder.deleteMany()
  await prisma.saleItem.deleteMany()
  await prisma.sale.deleteMany()
  await prisma.stockMovement.deleteMany()
  await prisma.purchaseOrderItem.deleteMany()
  await prisma.purchaseOrder.deleteMany()
  await prisma.paymentPayable.deleteMany()
  await prisma.accountsPayable.deleteMany()
  await prisma.paymentReceivable.deleteMany()
  await prisma.accountsReceivable.deleteMany()
  await prisma.product.deleteMany()
  await prisma.supplier.deleteMany()
  await prisma.user.deleteMany()
  await prisma.location.deleteMany()
  await prisma.business.deleteMany()
  await prisma.productImage.deleteMany()

  // Crear business (tenant)
  const business = await prisma.business.create({
    data: {
      name: 'Ferretería Centro',
      rfc: 'FCE200101ABC',
      plan: 'professional'
    }
  })

  // Crear locations
  const locationCentro = await prisma.location.create({
    data: {
      businessId: business.id,
      name: 'Sucursal Centro',
      clave: 'SC'
    }
  })

  const locationNorte = await prisma.location.create({
    data: {
      businessId: business.id,
      name: 'Sucursal Norte',
      clave: 'SN'
    }
  })

  const locationSur = await prisma.location.create({
    data: {
      businessId: business.id,
      name: 'Sucursal Sur',
      clave: 'SS'
    }
  })

  // Hash passwords
  const hashedPassword = await bcrypt.hash('password123', 10)

  // Crear usuarios
  const dueno = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'dueno@ferreteria.com',
      password: hashedPassword,
      name: 'Dueño Ferretería',
      role: 'dueno',
      active: true
    }
  })

  const vendedor = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'vendedor@ferreteria.com',
      password: hashedPassword,
      name: 'Vendedor Demo',
      role: 'vendedor',
      active: true
    }
  })

  const bodeguero = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'bodeguero@ferreteria.com',
      password: hashedPassword,
      name: 'Bodeguero Demo',
      role: 'bodeguero',
      active: true
    }
  })

  const cajero = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'cajero@ferreteria.com',
      password: hashedPassword,
      name: 'Cajero Demo',
      role: 'cajero',
      active: true
    }
  })

  const chofer = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'chofer@ferreteria.com',
      password: hashedPassword,
      name: 'Chofer Demo',
      role: 'chofer',
      active: true
    }
  })

  // Crear 3 drivers de demostración para entregas
  const driver1 = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'chofer1@ferreteria.com',
      password: hashedPassword,
      name: 'Chofer Juan',
      role: 'chofer',
      active: true
    }
  })

  const driver2 = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'chofer2@ferreteria.com',
      password: hashedPassword,
      name: 'Chofer María',
      role: 'chofer',
      active: true
    }
  })

  const driver3 = await prisma.user.create({
    data: {
      businessId: business.id,
      email: 'chofer3@ferreteria.com',
      password: hashedPassword,
      name: 'Chofer Carlos',
      role: 'chofer',
      active: true
    }
  })

  // Crear supplier
  const supplier = await prisma.supplier.create({
    data: {
      businessId: business.id,
      name: 'Proveedor Mayorista',
      contact: 'Juan Pérez',
      email: 'contacto@proveedor.com',
      phone: '5551234567',
      address: 'Calle Principal 123, CDMX'
    }
  })

  // Crear productos con ubicaciones
  const products = [
    {
      clave: '40-09-0109-607',
      name: 'Estuco Premium 20 KG',
      category: 'Acabados',
      costPrice: 85.0,
      price: 145.0,
      stock: 150,
      unit: 'pieza',
      aisle: 'P01',
      level: 'N2',
      side: 'DER',
      position: 'Pos 1'
    },
    {
      clave: '40-09-0310-401',
      name: 'Pintura Vinílica Blanco 4L',
      category: 'Acabados',
      costPrice: 95.0,
      price: 165.0,
      stock: 85,
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
      unit: 'kg',
      aisle: 'P04',
      level: 'N2',
      side: 'IZQ',
      position: 'Pos 3'
    },
    {
      clave: '46-00-9900-002',
      name: 'Herramienta Destornillador Phillips #2',
      category: 'Herramientas',
      costPrice: 15.0,
      price: 28.0,
      stock: 45,
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
      price: 210.0,
      stock: 200,
      unit: 'saco',
      aisle: 'P08',
      level: 'N3',
      side: 'DER',
      position: 'Pos 5'
    },
    {
      clave: '81-04-0103-002',
      name: 'Arena Fina 25KG',
      category: 'Materiales de Construcción',
      costPrice: 45.0,
      price: 78.0,
      stock: 300,
      unit: 'saco',
      aisle: 'P09',
      level: 'N2',
      side: 'DER',
      position: 'Pos 2'
    },
    {
      clave: '81-04-0103-003',
      name: 'Grava 25KG',
      category: 'Materiales de Construcción',
      costPrice: 50.0,
      price: 85.0,
      stock: 250,
      unit: 'saco',
      aisle: 'P10',
      level: 'N1',
      side: 'IZQ',
      position: 'Pos 3'
    },
    {
      clave: '43-02-0109-601',
      name: 'Masilla para Madera 500G',
      category: 'Acabados',
      costPrice: 18.0,
      price: 32.0,
      stock: 175,
      unit: 'pieza',
      aisle: 'P11',
      level: 'N3',
      side: 'IZQ',
      position: 'Pos 4'
    },
    {
      clave: '40-09-0109-608',
      name: 'Barniz Polyuretano Brillante 1L',
      category: 'Acabados',
      costPrice: 75.0,
      price: 135.0,
      stock: 92,
      unit: 'pieza',
      aisle: 'P12',
      level: 'N2',
      side: 'DER',
      position: 'Pos 6'
    }
  ]

  for (const productData of products) {
    const margin = ((productData.price - productData.costPrice) / productData.price) * 100

    await prisma.product.create({
      data: {
        businessId: business.id,
        locationId: locationCentro.id,
        supplierId: supplier.id,
        clave: productData.clave,
        name: productData.name,
        category: productData.category,
        costPrice: productData.costPrice,
        price: productData.price,
        margin: Math.round(margin * 100) / 100,
        stock: productData.stock,
        minStock: 10,
        unit: productData.unit,
        aisle: productData.aisle,
        level: productData.level,
        side: productData.side,
        position: productData.position,
        active: true
      }
    })
  }

  console.log('✓ Seed completado:')
  console.log(`  - 1 Business (Ferretería Centro)`)
  console.log(`  - 3 Locations (Centro, Norte, Sur)`)
  console.log(`  - 8 Users (Dueño, Vendedor, Bodeguero, Cajero + 3 Chofers)`)
  console.log(`  - 1 Supplier`)
  console.log(`  - 12 Products con ubicaciones y costos`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
