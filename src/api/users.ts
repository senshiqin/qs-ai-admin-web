import { http, unwrap } from './http'
import type { UserItem, UserPage, UserRoleCode } from '@/types/api'

export function getUsers(params: {
  pageNo: number
  pageSize: number
  keyword?: string
  roleCode?: string
  status?: number
}) {
  return unwrap<UserPage>(http.get('/api/v1/ai/users', { params }))
}

export function updateUserRole(userId: number, roleCode: UserRoleCode) {
  return unwrap<UserItem>(
    http.patch(`/api/v1/ai/users/${userId}/role`, {
      roleCode
    })
  )
}
