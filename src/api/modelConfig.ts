import { http, unwrap } from './http'
import type { ModelConfigResponse } from '@/types/api'

export function getModelConfig() {
  return unwrap<ModelConfigResponse>(http.get('/api/v1/ai/model-config'))
}

export function refreshModelConfig() {
  return unwrap<ModelConfigResponse>(http.post('/api/v1/ai/model-config/refresh'))
}
