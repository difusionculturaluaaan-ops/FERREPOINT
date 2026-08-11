export interface User {
 id: string
 email: string
 name: string
 role: "dueno" | "vendedor" | "cajero" | "bodeguero" | "chofer" | "admin" | "super_admin" | "encargado"
 businessId: string
 locationId?: string
 vendorId?: string
 enabledModules?: string[]
 active: boolean
 createdAt: Date
}

export interface LoginRequest {
 email: string
 password: string
 rememberMe?: boolean
}

export interface LoginResponse {
 success: boolean
 error?: string
 user?: User
 token?: string
}

export interface JWTPayload {
 userId: string
 email: string
 role: string
 businessId: string
 enabledModules?: string[]
 iat?: number
 exp?: number
}
