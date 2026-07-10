import { prisma } from '@/lib/prisma'
import { hash } from 'bcryptjs'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Clear existing data
    await prisma.saleItem.deleteMany({})
    await prisma.sale.deleteMany({})
    await prisma.surtidoItem.deleteMany({})
    await prisma.surtidoOrder.deleteMany({})
    await prisma.product.deleteMany({})
    await prisma.user.deleteMany({})
    await prisma.location.deleteMany({})
    await prisma.business.deleteMany({})

    // Create demo business
    const business = await prisma.business.create({
      data: {
        name: 'Ferretería Centro',
        rfc: 'FCE200101ABC',
        plan: 'professional'
      }
    })

    // Create location
    const location = await prisma.location.create({
      data: {
        businessId: business.id,
        name: 'Sucursal Centro',
        clave: 'SC',
        address: 'Av. Principal 123'
      }
    })

    // Create demo users
    await Promise.all([
      prisma.user.create({
        data: {
          businessId: business.id,
          email: 'dueno@ferreteria.com',
          password: await hash('password123', 10),
          name: 'Juan Dueño',
          role: 'dueno'
        }
      }),
      prisma.user.create({
        data: {
          businessId: business.id,
          email: 'vendedor@ferreteria.com',
          password: await hash('password123', 10),
          name: 'Carlos Vendedor',
          role: 'vendedor'
        }
      })
    ])

    // Create products
    const products = [
      { clave: '40-09-0109-607', name: 'Estuco Premium 20 KG', category: 'Estuco y Yeso', price: 73.28, stock: 45, minStock: 10 },
      { clave: '40-09-0110-001', name: 'Yeso Calcáreo 25 KG', category: 'Estuco y Yeso', price: 55.17, stock: 32, minStock: 8 },
      { clave: '10-01-0001-200', name: 'Cemento Gris 50 KG', category: 'Cemento', price: 108.62, stock: 120, minStock: 20 },
      { clave: '10-01-0002-100', name: 'Cemento Blanco 25 KG', category: 'Cemento', price: 189.66, stock: 18, minStock: 10 },
      { clave: '20-05-0001-400', name: 'Block 15×20×40 cm', category: 'Block', price: 8.62, stock: 850, minStock: 100 },
      { clave: '20-05-0002-100', name: 'Tabique Rojo 6×12×24 cm', category: 'Block', price: 3.45, stock: 1200, minStock: 200 },
      { clave: '30-03-0001-600', name: 'Varilla #3 Corrugada 6m', category: 'Acero', price: 95.69, stock: 7, minStock: 15 },
      { clave: '30-03-0002-800', name: 'Malla Electrosoldada 6×6', category: 'Acero', price: 310.34, stock: 22, minStock: 5 },
      { clave: '50-02-0001-300', name: 'Pintura Vinílica Blanca 19L', category: 'Pintura', price: 603.45, stock: 3, minStock: 5 },
      { clave: '50-02-0003-200', name: 'Impermeabilizante 19L', category: 'Pintura', price: 775.86, stock: 8, minStock: 4 },
      { clave: '60-07-0001-100', name: 'Tubo PVC 4" × 6m', category: 'Plomería', price: 181.03, stock: 28, minStock: 6 },
      { clave: '70-01-0001-500', name: 'Pala Cuadrada Truper', category: 'Herramientas', price: 224.14, stock: 11, minStock: 4 }
    ]

    for (const prod of products) {
      await prisma.product.create({
        data: {
          businessId: business.id,
          locationId: location.id,
          clave: prod.clave,
          name: prod.name,
          category: prod.category,
          price: prod.price,
          stock: prod.stock,
          minStock: prod.minStock,
          unit: 'PZA'
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Database seeded with demo data',
      credentials: {
        dueno: 'dueno@ferreteria.com / password123',
        vendedor: 'vendedor@ferreteria.com / password123'
      }
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
