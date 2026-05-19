import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'
import { useAuthStore } from '@/stores/auth'
import type { ApiResponse, LoginResponse } from '@/types/api'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 120000
})

type RetriableConfig = Parameters<typeof http.request>[0] & { _retry?: boolean }

let refreshPromise: Promise<string> | null = null

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
  async (response) => {
    const body = response.data as ApiResponse<unknown>
    const traceId = body?.traceId || response.headers['x-trace-id']
    if (body && typeof body.code === 'number' && body.code !== 200) {
      if (
        body.code === 401 &&
        (await refreshAndRetry(response.config as RetriableConfig, body.code))
      ) {
        return http.request(response.config)
      }
      ElMessage.error(formatErrorMessage(body.message || '请求失败', traceId))
      if (body.code === 401) {
        useAuthStore().clearSession()
        redirectToLogin()
      }
      return Promise.reject(body)
    }
    return response
  },
  async (error) => {
    const status = error?.response?.status
    const body = error?.response?.data as Partial<ApiResponse<unknown>> | undefined
    const traceId = body?.traceId || error?.response?.headers?.['x-trace-id']
    if (
      status === 401 &&
      (await refreshAndRetry(error.config as RetriableConfig, status))
    ) {
      return http.request(error.config)
    }
    if (status === 401) {
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

async function refreshAndRetry(config: RetriableConfig | undefined, status?: number) {
  const auth = useAuthStore()
  const url = config?.url || ''
  if (
    !config ||
    config._retry ||
    status !== 401 ||
    !auth.refreshToken ||
    url.includes('/api/v1/user/login') ||
    url.includes('/api/v1/user/refresh')
  ) {
    return false
  }
  config._retry = true
  try {
    const token = await refreshAccessTokenOnce(auth.refreshToken)
    config.headers = config.headers || {}
    config.headers.Authorization = token
    return true
  } catch {
    auth.clearSession()
    redirectToLogin()
    return false
  }
}

async function refreshAccessTokenOnce(refreshToken: string) {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<LoginResponse>>(
        '/api/v1/user/refresh',
        { refreshToken },
        { baseURL: import.meta.env.VITE_API_BASE_URL || '', timeout: 30000 }
      )
      .then((response) => {
        const body = response.data
        if (body.code !== 200 || !body.data?.accessToken) {
          throw new Error(body.message || 'refresh token failed')
        }
        const auth = useAuthStore()
        const token = body.data.tokenType
          ? `${body.data.tokenType} ${body.data.accessToken}`
          : `Bearer ${body.data.accessToken}`
        auth.setSession(token, body.data.username || auth.username, undefined, body.data.roleCode || auth.roleCode)
        return token
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

function formatErrorMessage(message: string, traceId?: string) {
  return traceId ? `${message} traceId=${traceId}` : message
}
