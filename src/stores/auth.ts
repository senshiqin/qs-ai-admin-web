import { defineStore } from 'pinia'

const TOKEN_KEY = 'qs_ai_token'
const REFRESH_TOKEN_KEY = 'qs_ai_refresh_token'
const USERNAME_KEY = 'qs_ai_username'
const ROLE_CODE_KEY = 'qs_ai_role_code'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem(TOKEN_KEY) || '',
    refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || '',
    username: localStorage.getItem(USERNAME_KEY) || '',
    roleCode: localStorage.getItem(ROLE_CODE_KEY) || ''
  }),
  getters: {
    isAuthed: (state) => Boolean(state.token)
  },
  actions: {
    setSession(token: string, username: string, refreshToken?: string, roleCode?: string) {
      this.token = token
      this.username = username
      if (refreshToken !== undefined) this.refreshToken = refreshToken
      if (roleCode !== undefined) this.roleCode = roleCode
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USERNAME_KEY, username)
      if (refreshToken !== undefined) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
      }
      if (roleCode !== undefined) {
        localStorage.setItem(ROLE_CODE_KEY, roleCode)
      }
    },
    clearSession() {
      this.token = ''
      this.refreshToken = ''
      this.username = ''
      this.roleCode = ''
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USERNAME_KEY)
      localStorage.removeItem(ROLE_CODE_KEY)
    }
  }
})
