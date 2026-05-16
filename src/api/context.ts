import { http, unwrap } from './http'
import type { ChatContextMessage } from '@/types/api'

export function listContextMessages(params: { userId: number; conversationId: string }) {
  return unwrap<ChatContextMessage[]>(http.get('/api/v1/ai/context/messages', { params }))
}

export function addContextMessage(payload: {
  userId: number
  conversationId: string
  role: ChatContextMessage['role']
  content: string
}) {
  return unwrap<void>(http.post('/api/v1/ai/context/messages', payload))
}

export function clearContextMessages(params: { userId: number; conversationId: string }) {
  return unwrap<boolean>(http.delete('/api/v1/ai/context/messages', { params }))
}
