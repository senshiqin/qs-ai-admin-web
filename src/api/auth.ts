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
