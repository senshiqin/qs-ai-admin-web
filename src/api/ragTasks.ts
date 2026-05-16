import { http, unwrap } from './http'
import type { RagIngestResponse, RagIngestTask, RagIngestTaskPage, TaskStatus } from '@/types/api'

export interface RagTaskQuery {
  pageNo: number
  pageSize: number
  status?: TaskStatus | ''
  fileId?: number
  kbCode?: string
}

export function pageRagTasks(params: RagTaskQuery) {
  return unwrap<RagIngestTaskPage>(http.get('/api/v1/ai/rag/tasks', { params }))
}

export function getRagTask(taskId: number) {
  return unwrap<RagIngestTask>(http.get(`/api/v1/ai/rag/tasks/${taskId}`))
}

export function retryRagTask(taskId: number) {
  return unwrap<RagIngestResponse>(http.post(`/api/v1/ai/rag/tasks/${taskId}/retry`))
}
