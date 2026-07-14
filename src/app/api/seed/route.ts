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
    // Note: ProductImage stays (shared gallery)

    // Create product image gallery (shared across all businesses)
    const images = await Promise.all([
      prisma.productImage.upsert({
        where: { name_category: { name: 'Estuco Premium', category: 'Estuco y Yeso' } },
        update: {},
        create: {
          name: 'Estuco Premium',
          category: 'Estuco y Yeso',
          imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=400&fit=crop'
        }
      }),
      prisma.productImage.upsert({
        where: { name_category: { name: 'Yeso Calcáreo', category: 'Estuco y Yeso' } },
        update: {},
        create: {
          name: 'Yeso Calcáreo',
          category: 'Estuco y Yeso',
          imageUrl: 'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?w=400&h=400&fit=crop'
        }
      }),
      prisma.productImage.upsert({
        where: { name_category: { name: 'Cemento Gris', category: 'Cemento' } },
        update: {},
        create: {
          name: 'Cemento Gris',
          category: 'Cemento',
          imageUrl: 'https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?w=400&h=400&fit=crop'
        }
      }),
      prisma.productImage.upsert({
        where: { name_category: { name: 'Cemento Blanco', category: 'Cemento' } },
        update: {},
        create: {
          name: 'Cemento Blanco',
          category: 'Cemento',
          imageUrl: 'https://images.unsplash.com/photo-1580828343064-fde4fc206bc6?w=400&h=400&fit=crop'
        }
      }),
      prisma.productImage.upsert({
        where: { name_category: { name: 'Block', category: 'Block' } },
        update: {},
        create: {
          name: 'Block',
          category: 'Block',
          imageUrl: 'https://images.unsplash.com/photo-1581092895505-e71b99652e0b?w=400&h=400&fit=crop'
        }
      }),
      prisma.productImage.upsert({
        where: { name_category: { name: 'Tabique', category: 'Block' } },
        update: {},
        create: {
          name: 'Tabique',
          category: 'Block',
          imageUrl: 'https://images.unsplash.com/photo-1581092895505-e71b99652e0b?w=400&h=400&fit=crop'
        }
      }),
      prisma.productImage.upsert({
        where: { name_category: { name: 'Varilla', category: 'Acero' } },
        update: {},
        create: {
          name: 'Varilla',
          category: 'Acero',
          imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=400&h=400&fit=crop'
        }
      }),
      prisma.productImage.upsert({
        where: { name_category: { name: 'Malla', category: 'Acero' } },
        update: {},
        create: {
          name: 'Malla',
          category: 'Acero',
          imageUrl: 'https://images.unsplash.com/photo-1581092162384-8987c1d64718?w=400&h=400&fit=crop'
        }
      }),
      prisma.productImage.upsert({
        where: { name_category: { name: 'Pintura Vinílica', category: 'Pintura' } },
        update: {},
        create: {
          name: 'Pintura Vinílica',
          category: 'Pintura',
          imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=400&fit=crop'
        }
      }),
      prisma.productImage.upsert({
        where: { name_category: { name: 'Impermeabilizante', category: 'Pintura' } },
        update: {},
        create: {
          name: 'Impermeabilizante',
          category: 'Pintura',
          imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=400&fit=crop'
        }
      }),
      prisma.productImage.upsert({
        where: { name_category: { name: 'Tubo PVC', category: 'Plomería' } },
        update: {},
        create: {
          name: 'Tubo PVC',
          category: 'Plomería',
          imageUrl: 'https://images.unsplash.com/photo-1578500494198-246f612d03b3?w=400&h=400&fit=crop'
        }
      }),
      prisma.productImage.upsert({
        where: { name_category: { name: 'Pala', category: 'Herramientas' } },
        update: {},
        create: {
          name: 'Pala',
          category: 'Herramientas',
          imageUrl: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop'
        }
      })
    ])

    const imageMap: { [key: string]: string } = {}
    images.forEach((img, i) => {
      const names = ['Estuco Premium', 'Yeso Calcáreo', 'Cemento Gris', 'Cemento Blanco', 'Block', 'Tabique', 'Varilla', 'Malla', 'Pintura Vinílica', 'Impermeabilizante', 'Tubo PVC', 'Pala']
      imageMap[names[i]] = img.id
    })

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
      }),
      prisma.user.create({
        data: {
          businessId: business.id,
          email: 'chofer1@ferreteria.com',
          password: await hash('password123', 10),
          name: 'Miguel Repartidor',
          role: 'chofer'
        }
      }),
      prisma.user.create({
        data: {
          businessId: business.id,
          email: 'chofer2@ferreteria.com',
          password: await hash('password123', 10),
          name: 'Pedro Entregador',
          role: 'chofer'
        }
      }),
      prisma.user.create({
        data: {
          businessId: business.id,
          email: 'chofer3@ferreteria.com',
          password: await hash('password123', 10),
          name: 'Luis Distribuidor',
          role: 'chofer'
        }
      })
    ])

    // Create products with image references
    const products = [
      { clave: '40-09-0109-607', name: 'Estuco Premium 20 KG', imageName: 'Estuco Premium', category: 'Estuco y Yeso', price: 73.28, stock: 45, minStock: 10 },
      { clave: '40-09-0110-001', name: 'Yeso Calcáreo 25 KG', imageName: 'Yeso Calcáreo', category: 'Estuco y Yeso', price: 55.17, stock: 32, minStock: 8 },
      { clave: '10-01-0001-200', name: 'Cemento Gris 50 KG', imageName: 'Cemento Gris', category: 'Cemento', price: 108.62, stock: 120, minStock: 20 },
      { clave: '10-01-0002-100', name: 'Cemento Blanco 25 KG', imageName: 'Cemento Blanco', category: 'Cemento', price: 189.66, stock: 18, minStock: 10 },
      { clave: '20-05-0001-400', name: 'Block 15×20×40 cm', imageName: 'Block', category: 'Block', price: 8.62, stock: 850, minStock: 100 },
      { clave: '20-05-0002-100', name: 'Tabique Rojo 6×12×24 cm', imageName: 'Tabique', category: 'Block', price: 3.45, stock: 1200, minStock: 200 },
      { clave: '30-03-0001-600', name: 'Varilla #3 Corrugada 6m', imageName: 'Varilla', category: 'Acero', price: 95.69, stock: 7, minStock: 15 },
      { clave: '30-03-0002-800', name: 'Malla Electrosoldada 6×6', imageName: 'Malla', category: 'Acero', price: 310.34, stock: 22, minStock: 5 },
      { clave: '50-02-0001-300', name: 'Pintura Vinílica Blanca 19L', imageName: 'Pintura Vinílica', category: 'Pintura', price: 603.45, stock: 3, minStock: 5 },
      { clave: '50-02-0003-200', name: 'Impermeabilizante 19L', imageName: 'Impermeabilizante', category: 'Pintura', price: 775.86, stock: 8, minStock: 4 },
      { clave: '60-07-0001-100', name: 'Tubo PVC 4" × 6m', imageName: 'Tubo PVC', category: 'Plomería', price: 181.03, stock: 28, minStock: 6 },
      { clave: '70-01-0001-500', name: 'Pala Cuadrada Truper', imageName: 'Pala', category: 'Herramientas', price: 224.14, stock: 11, minStock: 4 }
    ]

    for (const prod of products) {
      await prisma.product.create({
        data: {
          businessId: business.id,
          locationId: location.id,
          imageId: imageMap[prod.imageName],
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
        vendedor: 'vendedor@ferreteria.com / password123',
        choferes: '3 conductores disponibles para entregas'
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
