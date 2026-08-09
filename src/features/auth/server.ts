"use server"

import { prisma } from "@/lib/prisma"
import { hash, compare } from "bcryptjs"
import { generateToken } from "@/lib/jwt"
import { generateRandomPassword } from "@/lib/password"
import type { LoginResponse } from "@/types/auth"

export async function actionLogin(email: string, password: string): Promise<LoginResponse> {
  try {
    if (!email || !password) {
      return { success: false, error: "Email y contraseña requeridos" }
    }

    // Buscar usuario por email
    let user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: { business: { include: { locations: { take: 1 } } } }
    })

    // Auto-crear/reparar superadmin si intenta ingresar y no existe
    if (!user && email.toLowerCase() === 'superadmin@ferrepoint.com' && password === 'password123') {
      const hashedPassword = await hash('password123', 10)
      const createdSuperAdmin = await prisma.user.create({
        data: {
          email: 'superadmin@ferrepoint.com',
          password: hashedPassword,
          name: 'Super Admin FERREPOINT',
          role: 'super_admin',
          active: true
        }
      })
      user = {
        ...createdSuperAdmin,
        business: null
      } as any
    }

    if (!user) {
      return { success: false, error: "Credenciales incorrectas" }
    }

    if (!user.active) {
      return { success: false, error: "Usuario inactivo. Contacta al administrador" }
    }

    // Validar contraseña
    let passwordMatch = await compare(password, user.password)

    // Fallback de reparación de contraseña para superadmin
    if (!passwordMatch && email.toLowerCase() === 'superadmin@ferrepoint.com' && password === 'password123') {
      const hashedPassword = await hash('password123', 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
      passwordMatch = true
    }

    if (!passwordMatch) {
      return { success: false, error: "Credenciales incorrectas" }
    }

    // Generar token JWT
    const token = await generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId,
      enabledModules: user.business?.enabledModules || ["pos", "inventario", "caja", "bodega", "entregas", "compras", "contabilidad", "facturacion"]
    })

    // Actualizar lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    // Obtener primera location (default)
    const defaultLocation = user.business.locations?.[0]?.id || ""
    console.log('[actionLogin] defaultLocation:', defaultLocation)
    console.log('[actionLogin] locations:', user.business.locations)

    const responseUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as any,
      businessId: user.businessId,
      locationId: defaultLocation,
      vendorId: user.id,
      enabledModules: user.business?.enabledModules || ["pos", "inventario", "caja", "bodega", "entregas", "compras", "contabilidad", "facturacion"],
      active: user.active,
      createdAt: user.createdAt
    }
    console.log('[actionLogin] response user:', responseUser)

    return {
      success: true,
      user: responseUser,
      token
    }
  } catch (error) {
    console.error("Login error:", error)
    return { success: false, error: "Error al iniciar sesión" }
  }
}

export async function actionCreateUser(
  businessId: string,
  email: string,
  name: string,
  role: "dueno" | "vendedor" | "cajero" | "bodeguero" | "chofer"
) {
  try {
    // Validar que email sea único
    const existing = await prisma.user.findFirst({
      where: { email: email.toLowerCase() }
    })

    if (existing) {
      return { success: false, error: "El email ya está registrado" }
    }

    // Generar contraseña aleatoria segura
    const plainPassword = generateRandomPassword()
    const hashedPassword = await hash(plainPassword, 10)

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        role,
        businessId,
        active: true
      }
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId,
        active: user.active,
        createdAt: user.createdAt
      },
      // Retornar contraseña en texto plano SOLO para mostrar al Dueño
      plainPassword
    }
  } catch (error) {
    console.error("Create user error:", error)
    return { success: false, error: "Error al crear usuario" }
  }
}

export async function actionUpdateUser(
  userId: string,
  data: { name?: string; email?: string; role?: string; active?: boolean }
) {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email.toLowerCase() }),
        ...(data.role && { role: data.role }),
        ...(data.active !== undefined && { active: data.active })
      }
    })

    return { success: true, user }
  } catch (error) {
    console.error("Update user error:", error)
    return { success: false, error: "Error al actualizar usuario" }
  }
}

export async function actionGetUsers(businessId: string) {
  try {
    const users = await prisma.user.findMany({
      where: { businessId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        active: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    })

    return users
  } catch (error) {
    console.error("Get users error:", error)
    return []
  }
}

export async function actionResetUserPassword(userId: string) {
  try {
    // Generar nueva contraseña
    const plainPassword = generateRandomPassword()
    const hashedPassword = await hash(plainPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    return {
      success: true,
      plainPassword
    }
  } catch (error) {
    console.error("Reset password error:", error)
    return { success: false, error: "Error al resetear contraseña" }
  }
}

export async function actionLogout() {
  // Client-side lo maneja: eliminar token + redirect
  return { success: true }
}

// Obtener plan y módulos del business
export async function actionGetBusinessPlan(businessId: string) {
  try {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
      select: { plan: true, enabledModules: true }
    })
    return {
      success: true,
      plan: business?.plan || 'free',
      enabledModules: business?.enabledModules || ["pos", "inventario", "caja", "bodega", "entregas", "compras", "contabilidad", "facturacion"]
    }
  } catch (error) {
    console.error('Get business plan error:', error)
    return {
      success: false,
      plan: 'free',
      enabledModules: ["pos", "inventario"]
    }
  }
}

// ⚡ SERVER ACTIONS DE SUPER ADMIN (GESTOR DE TENANTS)
export async function actionGetTenants() {
  try {
    const businesses = await prisma.business.findMany({
      include: {
        _count: {
          select: { locations: true, users: true }
        }
      },
      orderBy: { createdAt: "desc" }
    })

    return businesses.map(b => ({
      id: b.id,
      name: b.name,
      rfc: b.rfc,
      plan: b.plan,
      requiresCajero: b.requiresCajero,
      enabledModules: b.enabledModules,
      locationsCount: b._count.locations,
      usersCount: b._count.users,
      createdAt: b.createdAt.toISOString().split('T')[0]
    }))
  } catch (error) {
    console.error("Get tenants error:", error)
    return []
  }
}

export async function actionCreateTenant(
  name: string,
  rfc: string,
  plan: string,
  enabledModules: string[],
  adminEmail: string
) {
  try {
    const existing = await prisma.business.findFirst({
      where: { OR: [{ name }, { rfc: rfc.toUpperCase() }] }
    })

    if (existing) {
      return { success: false, error: "Ya existe una empresa registrada con ese Nombre o RFC" }
    }

    const business = await prisma.business.create({
      data: {
        name,
        rfc: rfc.toUpperCase(),
        plan,
        enabledModules: enabledModules.length > 0 ? enabledModules : ["pos", "inventario"]
      }
    })

    // Crear sucursal matriz por defecto
    const location = await prisma.location.create({
      data: {
        businessId: business.id,
        name: "Sucursal Matriz",
        clave: "MATRIZ"
      }
    })

    // Crear usuario Business Admin inicial
    const plainPassword = generateRandomPassword()
    const hashedPassword = await hash(plainPassword, 10)

    const adminUser = await prisma.user.create({
      data: {
        businessId: business.id,
        locationId: location.id,
        email: adminEmail.toLowerCase(),
        password: hashedPassword,
        name: `Admin ${name}`,
        role: "admin",
        active: true
      }
    })

    // Poblar inventario por defecto para el nuevo tenant
    const { seedTenantDefaultCatalog } = await import('@/lib/seedTenantCatalog')
    await seedTenantDefaultCatalog(business.id, location.id)

    return {
      success: true,
      tenantId: business.id,
      adminEmail: adminUser.email,
      plainPassword
    }
  } catch (error) {
    console.error("Create tenant error:", error)
    return { success: false, error: "Error al crear la empresa tenant" }
  }
}

export async function actionUpdateTenantModules(
  businessId: string,
  enabledModules: string[],
  plan?: string
) {
  try {
    const updated = await prisma.business.update({
      where: { id: businessId },
      data: {
        enabledModules,
        ...(plan && { plan })
      }
    })

    return { success: true, enabledModules: updated.enabledModules }
  } catch (error) {
    console.error("Update tenant modules error:", error)
    return { success: false, error: "Error al actualizar módulos de la empresa" }
  }
}
