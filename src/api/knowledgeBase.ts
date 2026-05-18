import { http, unwrap } from './http'
import type { KnowledgeBase } from '@/types/api'

export function listKnowledgeBases() {
  return unwrap<KnowledgeBase[]>(http.get('/api/v1/ai/knowledge-bases'))
}

export function createKnowledgeBase(payload: {
  kbCode: string
  name: string
  description?: string
  status?: number
}) {
  return unwrap<KnowledgeBase>(http.post('/api/v1/ai/knowledge-bases', payload))
}

export function updateKnowledgeBase(
  id: number,
  payload: {
    kbCode: string
    name: string
    description?: string
    status?: number
  }
) {
  return unwrap<KnowledgeBase>(http.put(`/api/v1/ai/knowledge-bases/${id}`, payload))
}

export function deleteKnowledgeBase(id: number) {
  return unwrap<boolean>(http.delete(`/api/v1/ai/knowledge-bases/${id}`))
}
