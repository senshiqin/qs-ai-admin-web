import { http, unwrap } from './http'
import type {
  LangChain4jChatResponse,
  LangChain4jEmbedResponse,
  LangChain4jRagResponse,
  LangChain4jSequentialRagResponse
} from '@/types/api'

export function embedText(payload: { text: string }) {
  return unwrap<LangChain4jEmbedResponse>(http.post('/api/v1/ai/langchain4j/embed', payload))
}

export function langChainChat(payload: {
  systemPrompt?: string
  message: string
  model?: string
  temperature?: number
}) {
  return unwrap<LangChain4jChatResponse>(http.post('/api/v1/ai/langchain4j/chat', payload))
}

export function langChainRag(payload: {
  question: string
  provider?: string
  topK?: number
  minScore?: number
  model?: string
  temperature?: number
  maxTokens?: number
}) {
  return unwrap<LangChain4jRagResponse>(http.post('/api/v1/ai/langchain4j/rag', payload))
}

export function langChainSequentialRag(payload: {
  question: string
  conversationId?: string
  provider?: string
  model?: string
  temperature?: number
  topK?: number
  minScore?: number
  maxInputTokens?: number
  maxMemoryTokens?: number
  maxContextTokens?: number
  summaryMaxTokens?: number
  answerMaxTokens?: number
  saveMemory?: boolean
}) {
  return unwrap<LangChain4jSequentialRagResponse>(
    http.post('/api/v1/ai/langchain4j/sequential-rag', payload)
  )
}
