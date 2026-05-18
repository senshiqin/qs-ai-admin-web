import { http, unwrap } from './http'
import type {
  RagAdvancedRetrieveResponse,
  RagEvalResponse,
  RagRetrieveResponse,
  RagRewriteResponse
} from '@/types/api'

export function retrieveRag(payload: { queryText: string; kbCode?: string; topK: number; minScore: number }) {
  return unwrap<RagRetrieveResponse>(http.post('/api/v1/ai/rag/retrieve', payload))
}

export function rewriteRagQuery(payload: {
  queryText: string
  useLlm: boolean
  provider?: string
  model?: string
}) {
  return unwrap<RagRewriteResponse>(http.post('/api/v1/ai/rag/rewrite', payload))
}

export function retrieveRagAdvanced(payload: {
  queryText: string
  kbCode?: string
  topK: number
  minScore: number
  rewrite: boolean
  rewriteWithLlm: boolean
  provider?: string
  model?: string
  candidateTopK: number
  searchMode: string
  vectorWeight: number
}) {
  return unwrap<RagAdvancedRetrieveResponse>(http.post('/api/v1/ai/rag/retrieve/advanced', payload))
}

export function evaluateRag(payload: {
  queryText: string
  kbCode?: string
  expectedKeywords: string[]
  expectedFileName?: string
  topK: number
  minScore: number
  rewrite: boolean
  rewriteWithLlm: boolean
  provider?: string
  model?: string
  searchMode: string
  vectorWeight: number
}) {
  return unwrap<RagEvalResponse>(http.post('/api/v1/ai/rag/eval', payload))
}

export async function streamRagAnswer(
  payload: {
    queryText: string
    kbCode?: string
    provider?: string
    model?: string
    temperature?: number
    topK: number
    minScore: number
  },
  handlers: {
    onSources?: (data: unknown) => void
    onMessage?: (text: string) => void
    onResult?: (data: unknown) => void
    onDone?: () => void
    onError?: (message: string) => void
  }
) {
  await postSse('/api/v1/ai/rag/ask/stream', payload, handlers)
}

export async function postSse(
  url: string,
  payload: unknown,
  handlers: {
    onSources?: (data: unknown) => void
    onMessage?: (text: string) => void
    onResult?: (data: unknown) => void
    onDone?: () => void
    onError?: (message: string) => void
  }
) {
  const token = localStorage.getItem('qs_ai_token')
  const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
  const response = await fetch(`${baseUrl}${url}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token.startsWith('Bearer ') ? token : `Bearer ${token}` } : {})
    },
    body: JSON.stringify(payload)
  })
  if (!response.ok) {
    const message = await response.text().catch(() => '')
    throw new Error(`SSE 请求失败: ${response.status}${message ? ` ${message}` : ''}`)
  }
  if (!response.body) {
    throw new Error('SSE 响应体为空')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split(/\r?\n\r?\n/)
    buffer = events.pop() || ''
    events.forEach((raw) => dispatchSseEvent(raw, handlers))
  }
  if (buffer.trim()) {
    dispatchSseEvent(buffer, handlers)
  }
}

function dispatchSseEvent(
  raw: string,
  handlers: {
    onSources?: (data: unknown) => void
    onMessage?: (text: string) => void
    onResult?: (data: unknown) => void
    onDone?: () => void
    onError?: (message: string) => void
  }
) {
  const event = raw
    .split(/\r?\n/)
    .find((line) => line.startsWith('event:'))
    ?.replace('event:', '')
    .trim()
  const data = raw
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.replace(/^data:\s?/, ''))
    .join('\n')

  if (event === 'message') handlers.onMessage?.(data)
  else if (event === 'sources') handlers.onSources?.(safeJson(data))
  else if (event === 'result') handlers.onResult?.(safeJson(data))
  else if (event === 'done') handlers.onDone?.()
  else if (event === 'error') handlers.onError?.(data)
}

function safeJson(data: string) {
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}
