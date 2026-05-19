import { http, unwrap } from './http'
import type { LoginResponse } from '@/types/api'

export function login(username: string, password: string) {
  return unwrap<LoginResponse>(
    http.post('/api/v1/user/login', {
      username,
      password
    })
  )
}

export function register(payload: {
  username: string
  password: string
  nickname?: string
  email?: string
}) {
  return unwrap<LoginResponse>(http.post('/api/v1/user/register', payload))
}

export function refreshAccessToken(refreshToken: string) {
  return unwrap<LoginResponse>(
    http.post('/api/v1/user/refresh', {
      refreshToken
    })
  )
}
