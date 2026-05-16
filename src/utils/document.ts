import type { TaskStatus } from '@/types/api'

export type ElementTagType = 'primary' | 'success' | 'warning' | 'danger' | 'info'

export function documentStatusText(status?: number) {
  return ['待处理', '处理中', '成功', '失败'][status ?? -1] || '未知'
}

export function documentStatusType(status?: number): ElementTagType {
  if (status === 2) return 'success'
  if (status === 3) return 'danger'
  if (status === 1) return 'warning'
  return 'info'
}

export function formatFileSize(size?: number | null) {
  if (size == null || Number.isNaN(size)) return '-'
  if (size < 1024) return `${size} B`

  const units = ['KB', 'MB', 'GB', 'TB']
  let value = size / 1024
  let unitIndex = 0

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024
    unitIndex += 1
  }

  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${units[unitIndex]}`
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-'
  return value.replace('T', ' ').slice(0, 19)
}

export function formatDuration(ms?: number | null) {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms} ms`
  if (ms < 60_000) return `${Math.round(ms / 1000)} s`
  return `${Math.round(ms / 60_000)} min`
}

export function taskStatusText(status?: TaskStatus | string) {
  const map: Record<string, string> = {
    PENDING: '等待中',
    RUNNING: '运行中',
    SUCCESS: '成功',
    FAILED: '失败'
  }
  return status ? map[status] || status : '-'
}

export function taskStatusType(status?: TaskStatus | string): ElementTagType {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'RUNNING') return 'warning'
  return 'info'
}
