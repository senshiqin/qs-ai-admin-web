import { http, unwrap } from './http'
import type { HealthData } from '@/types/api'

export function getHealth() {
  return unwrap<HealthData>(http.get('/health'))
}
