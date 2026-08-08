import { api } from './api'

export interface LoginResponse {
  token: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    isSuperAdmin: boolean
    organization: {
      id: string
      name: string
      domain?: string
      status: string
    } | null
    role: string | null
  }
}

export async function loginApi(email: string, password: string): Promise<LoginResponse> {
  return api.post<LoginResponse>('/auth/login', { email, password })
}

export async function getMeApi(): Promise<LoginResponse['user']> {
  return api.get<LoginResponse['user']>('/auth/me')
}
