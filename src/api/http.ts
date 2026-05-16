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
    if (body && typeof body.code === 'number' && body.code !== 200) {
      const trace = body.traceId ? ` traceId=${body.traceId}` : ''
      ElMessage.error(`${body.message || '请求失败'}${trace}`)
      if (body.code === 401 || body.code === 403) {
        useAuthStore().clearSession()
        router.push('/login')
      }
      return Promise.reject(body)
    }
    return response
  },
  (error) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) {
      useAuthStore().clearSession()
      router.push('/login')
    }
    ElMessage.error(error?.response?.data?.message || error.message || '网络异常')
    return Promise.reject(error)
  }
)

export async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<ApiResponse<T>> {
  const response = await request
  return response.data
}
