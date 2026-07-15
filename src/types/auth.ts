export interface User {
  id: string
  email: string
  name: string
  role: "dueno" | "vendedor" | "cajero" | "bodeguero" | "chofer"
  businessId: string
  locationId?: string
  vendorId?: string
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
  iat?: number
  exp?: number
}
