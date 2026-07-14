import { SignJWT, jwtVerify } from "jose"
import type { JWTPayload } from "@/types/auth"

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production"
)
const EXPIRATION = "7d" // 7 días

export async function generateToken(payload: Omit<JWTPayload, "iat" | "exp">): Promise<string> {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET)
  return token
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const verified = await jwtVerify(token, SECRET)
    return verified.payload as unknown as JWTPayload
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const parts = token.split(".")
    if (parts.length !== 3) return null
    const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString())
    return decoded as JWTPayload
  } catch (error) {
    return null
  }
}
