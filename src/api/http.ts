import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse } from '@/types/api'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 120000
})

http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers.Authorization = auth.token.startsWith('Bearer ')
      ? auth.token
      : `Bearer ${auth.token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>
    const traceId = body?.traceId || response.headers['x-trace-id']
    if (body && typeof body.code === 'number' && body.code !== 200) {
      ElMessage.error(formatErrorMessage(body.message || '请求失败', traceId))
      if (body.code === 401 || body.code === 403) {
        useAuthStore().clearSession()
        redirectToLogin()
      }
      return Promise.reject(body)
    }
    return response
  },
  (error) => {
    const status = error?.response?.status
    const body = error?.response?.data as Partial<ApiResponse<unknown>> | undefined
    const traceId = body?.traceId || error?.response?.headers?.['x-trace-id']
    if (status === 401 || status === 403) {
      useAuthStore().clearSession()
      redirectToLogin()
    }
    ElMessage.error(formatErrorMessage(body?.message || error.message || '网络异常', traceId))
    return Promise.reject(error)
  }
)

export async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<ApiResponse<T>> {
  const response = await request
  return response.data
}

function redirectToLogin() {
  if (router.currentRoute.value.path !== '/login') {
    router.push('/login')
  }
}

function formatErrorMessage(message: string, traceId?: string) {
  return traceId ? `${message} traceId=${traceId}` : message
}
