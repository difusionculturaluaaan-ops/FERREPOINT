import jwt from "jsonwebtoken"
import type { JWTPayload } from "@/types/auth"

const SECRET = process.env.JWT_SECRET || "tu-secret-key-cambiar-en-produccion"
const EXPIRATION = "7d" // 7 días

export function generateToken(payload: Omit<JWTPayload, "iat" | "exp">): string {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRATION })
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, SECRET)
    return decoded as JWTPayload
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    return jwt.decode(token) as JWTPayload
  } catch (error) {
    return null
  }
}
