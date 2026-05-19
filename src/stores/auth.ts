import { defineStore } from 'pinia'

const TOKEN_KEY = 'qs_ai_token'
const REFRESH_TOKEN_KEY = 'qs_ai_refresh_token'
const USERNAME_KEY = 'qs_ai_username'
const ROLE_CODE_KEY = 'qs_ai_role_code'
const ROLE_CODES_KEY = 'qs_ai_role_codes'
const PERMISSIONS_KEY = 'qs_ai_permissions'
const LEGACY_ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'dashboard:view',
    'chat:use',
    'rag:debug',
    'document:view',
    'document:upload',
    'document:delete',
    'model-config:view',
    'model-config:refresh',
    'monitor:view',
    'admin:user-manage'
  ],
  USER: [
    'dashboard:view',
    'chat:use',
    'rag:debug',
    'document:view',
    'document:upload',
    'model-config:view',
    'monitor:view'
  ],
  VIEWER: ['dashboard:view', 'document:view', 'model-config:view', 'monitor:view']
}

function parseStoredArray(key: string) {
  try {
    const value = localStorage.getItem(key)
    return value ? (JSON.parse(value) as string[]) : []
  } catch {
    return []
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
    username: localStorage.getItem(USERNAME_KEY) || '',
    roleCode: localStorage.getItem(ROLE_CODE_KEY) || '',
    roleCodes: parseStoredArray(ROLE_CODES_KEY),
    permissions: parseStoredArray(PERMISSIONS_KEY)
  }),
  getters: {
    isAuthed: (state) => Boolean(state.token),
    hasPermission: (state) => (permission: string) => {
      if (state.permissions.length) return state.permissions.includes(permission)
      return (LEGACY_ROLE_PERMISSIONS[state.roleCode] || []).includes(permission)
    }
  },
  actions: {
    setSession(
      token: string,
      username: string,
      refreshToken?: string,
      roleCode?: string,
      roleCodes?: string[],
      permissions?: string[]
    ) {
      this.token = token
      this.username = username
      if (refreshToken !== undefined) this.refreshToken = refreshToken
      if (roleCode !== undefined) this.roleCode = roleCode
      if (roleCodes !== undefined) this.roleCodes = roleCodes
      if (permissions !== undefined) this.permissions = permissions
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USERNAME_KEY, username)
      if (refreshToken !== undefined) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      }
      if (roleCode !== undefined) {
        localStorage.setItem(ROLE_CODE_KEY, roleCode)
      }
      if (roleCodes !== undefined) {
        localStorage.setItem(ROLE_CODES_KEY, JSON.stringify(roleCodes))
      }
      if (permissions !== undefined) {
        localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions))
      }
    },
    clearSession() {
      this.token = ''
      this.refreshToken = ''
      this.username = ''
      this.roleCode = ''
      this.roleCodes = []
      this.permissions = []
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USERNAME_KEY)
      localStorage.removeItem(ROLE_CODE_KEY)
      localStorage.removeItem(ROLE_CODES_KEY)
      localStorage.removeItem(PERMISSIONS_KEY)
    }
  }
})
