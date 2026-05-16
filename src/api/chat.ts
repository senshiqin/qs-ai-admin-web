import { http, unwrap } from './http'
import { postSse } from './rag'
import type { ChatSendRequest, ChatSendResponse } from '@/types/api'

export function sendChat(payload: ChatSendRequest) {
  return unwrap<ChatSendResponse>(http.post('/api/v1/ai/chat/send', payload))
}

export function streamChat(payload: ChatSendRequest, onMessage: (text: string) => void, onDone?: () => void) {
  return postSse('/api/v1/ai/chat/stream', payload, {
    onMessage,
    onDone,
    onError: (message) => {
      throw new Error(message)
    }
  })
}
