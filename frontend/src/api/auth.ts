import { request } from './client'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name?: string
  email: string
  password: string
}

export interface AuthUser {
  id?: number
  name?: string
  email?: string
  [key: string]: unknown
}

export interface LoginResponse {
  data: {
    token: string
    user: AuthUser
  }
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    return request<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      silent: true,
    })
  },

  register: async (payload: RegisterPayload): Promise<void> => {
    await request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
      silent: true,
    })
  },
}
