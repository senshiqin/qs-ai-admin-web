import axios from 'axios'
import type { ActuatorHealth, ActuatorMetrics } from '@/types/api'

const actuator = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 30000
})

export async function getActuatorHealth() {
  const response = await actuator.get<ActuatorHealth>('/actuator/health')
  return response.data
}

export async function getActuatorMetrics() {
  const response = await actuator.get<ActuatorMetrics>('/actuator/metrics')
  return response.data
}

export async function getActuatorPrometheus() {
  const response = await actuator.get<string>('/actuator/prometheus', {
    responseType: 'text'
  })
  return response.data
}
