"use server"

import { prisma } from "@/lib/prisma"
import { hash, compare } from "bcryptjs"
import { generateToken } from "@/lib/jwt"
import type { LoginResponse } from "@/types/auth"

export async function actionLogin(email: string, password: string): Promise<LoginResponse> {
  try {
    if (!email || !password) {
      return { success: false, error: "Email y contraseña requeridos" }
    }

    // Buscar usuario por email
    const user = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
      include: { business: true }
    })

    if (!user) {
      return { success: false, error: "Credenciales incorrectas" }
    }

    if (!user.active) {
      return { success: false, error: "Usuario inactivo. Contacta al administrador" }
    }

    // Validar contraseña
    const passwordMatch = await compare(password, user.password)
    if (!passwordMatch) {
      return { success: false, error: "Credenciales incorrectas" }
    }

    // Generar token JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: user.businessId
    })

    // Actualizar lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        businessId: user.businessId,
        active: user.active,
        createdAt: user.createdAt
      },
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
  password: string,
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

    // Hash password
    const hashedPassword = await hash(password, 10)

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
      }
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

export async function actionLogout() {
  // Client-side lo maneja: eliminar token + redirect
  return { success: true }
}
