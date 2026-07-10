'use server'

import { prisma } from '@/lib/prisma'
import { hash, compare } from 'bcryptjs'

export async function actionLogin(email: string, password: string, businessId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: {
        email_businessId: { email, businessId }
      }
    })

    if (!user || !(await compare(password, user.password))) {
      return { error: 'Email o contraseña inválidos' }
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        businessId: user.businessId
      }
    }
  } catch (error) {
    return { error: 'Error al iniciar sesión' }
  }
}

export async function actionRegisterUser(
  email: string,
  password: string,
  name: string,
  businessId: string,
  role: string = 'vendedor'
) {
  try {
    const hashedPassword = await hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        businessId,
        role
      }
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    }
  } catch (error) {
    return { error: 'Error al registrar usuario' }
  }
}
