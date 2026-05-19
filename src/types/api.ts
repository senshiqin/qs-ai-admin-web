export interface ApiResponse<T> {
  code: number
  message: string
  data: T
  traceId?: string
  timestamp?: string
}

export interface LoginResponse {
  userId: string
  username: string
  roleCode?: string
  tokenType: string
  accessToken: string
  expiresInSeconds: number
  refreshToken?: string
  refreshExpiresInSeconds?: number
}

export type UserRoleCode = 'ADMIN' | 'USER' | 'VIEWER'

export interface UserItem {
  id: number
  userNo: string
  username: string
  roleCode: UserRoleCode
  nickname?: string
  email?: string
  status: number
  userPoints: number
  lastLoginTime?: string
  createTime?: string
  updateTime?: string
}

export interface UserPage {
  pageNo: number
  pageSize: number
  total: number
  pages: number
  records: UserItem[]
}

export interface HealthData {
  status: string
}

export interface DocumentItem {
  id: number
  kbCode: string
  fileName: string
  fileType: string
  fileSize: number
  storagePath: string
  fileHash: string
  parseStatus: number
  deleteStatus?: string
  deleteErrorMessage?: string
  version?: number
  chunkCount: number
  embeddingModel: string
  vectorIndexName: string
  lastParseTime?: string
  uploaderUserId: number
  remark?: string
  createTime?: string
  updateTime?: string
}

export interface KnowledgeBase {
  id: number
  kbCode: string
  name: string
  description?: string
  status: number
  documentCount: number
  createTime?: string
  updateTime?: string
}

export interface DocumentDeleteResponse {
  fileId: number
  metadataDeleted: boolean
  deletedVectorCount: number
  physicalDeleted: boolean
  deleteStatus?: string
  deleteErrorMessage?: string
}

export interface DocumentPage {
  pageNo: number
  pageSize: number
  total: number
  pages: number
  records: DocumentItem[]
}

export interface RagIngestResponse {
  taskId?: number
  fileId: number
  kbCode: string
  fileName: string
  fileType: string
  storagePath: string
  textLength: number
  chunkCount: number
  embeddingModel: string
  embeddingDimension: number
  storedVectorCount: number
  parseStatus: number
}

export interface BatchUploadResponse {
  submittedCount: number
  async: boolean
  files: RagIngestResponse[]
}

export interface RagChunk {
  chunkId: string
  fileId: number
  chunkIndex: number
  score: number
  content: string
  fileName: string
  fileType: string
  storagePath: string
  kbCode: string
}

export interface RagRetrieveResponse {
  queryText: string
  kbCode: string
  topK: number
  minScore: number
  embeddingModel: string
  embeddingDimension: number
  hitCount: number
  chunks: RagChunk[]
  ragContext: string
}

export type TaskStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED'

export interface RagIngestTask {
  id: number
  taskNo: string
  knowledgeFileId: number
  kbCode: string
  fileName: string
  storagePath: string
  status: TaskStatus
  progressPercent: number
  currentStep: string
  retryCount: number
  maxRetry: number
  chunkSize: number
  overlapRatio: number
  textLength?: number
  chunkCount?: number
  storedVectorCount?: number
  embeddingModel?: string
  errorMessage?: string
  startedAt?: string
  finishedAt?: string
  durationMs?: number
  createTime?: string
  updateTime?: string
}

export interface RagIngestTaskPage {
  pageNo: number
  pageSize: number
  total: number
  pages: number
  records: RagIngestTask[]
}

export interface RagRewriteResponse {
  originalQuery: string
  rewrittenQuery: string
  changed: boolean
  llmUsed: boolean
  queryVariants: string[]
}

export interface RagRerankChunk {
  chunkId: string
  fileId: number
  chunkIndex: number
  vectorScore: number
  keywordScore: number
  rerankScore: number
  content: string
  fileName: string
  fileType: string
  storagePath: string
  kbCode: string
}

export interface RagAdvancedRetrieveResponse {
  originalQuery: string
  rewrittenQuery: string
  kbCode: string
  searchMode: string
  vectorWeight: number
  rewriteUsed: boolean
  topK: number
  candidateTopK: number
  minScore: number
  hitCount: number
  chunks: RagRerankChunk[]
  ragContext: string
}

export interface RagEvalResponse {
  queryText: string
  rewrittenQuery: string
  kbCode: string
  searchMode: string
  vectorWeight: number
  topK: number
  hitCount: number
  keywordRecall: number
  expectedFileHit: boolean
  passed: boolean
  matchedKeywords: string[]
  missingKeywords: string[]
  chunks: RagRerankChunk[]
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatSendRequest {
  conversationId?: string
  provider?: string
  model?: string
  temperature?: number
  maxTokens?: number
  maxInputTokens?: number
  messages: ChatMessage[]
}

export interface ChatSendResponse {
  conversationId: string
  modelType: string
  answer: string
  totalTokens?: number
}

export interface ModelConfigResponse {
  version: number
  refreshedAt: string
  defaultProvider: string
  fallbackToDefault: boolean
  autoRefresh: boolean
  refreshIntervalMs: number
  externalFile?: string
  modelPrefixRoutes: Record<string, string>
  providers: ModelProvider[]
}

export interface ModelProvider {
  key: string
  provider: string
  displayName: string
  enabled: boolean
  aliases: string[]
  apiKeyConfigured: boolean
  baseUrl: string
  chatPath: string
  defaultModel: string
  temperature: number
  maxTokens: number
  maxInputTokens: number
  connectTimeoutMs: number
  readTimeoutMs: number
  embedding?: {
    enabled: boolean
    path: string
    model: string
    dimensions: number
    batchSize: number
  }
  ollama?: {
    numPredict: number
    numCtx: number
    numThread?: number
    keepAlive: string
  }
}

export interface LangChain4jEmbedResponse {
  model: string
  dimension: number
  preview: number[]
}

export interface LangChain4jChatResponse {
  answer: string
  model: string
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
}

export interface LangChain4jRagChunk {
  chunkId: string
  fileId: number
  chunkIndex: number
  score?: number
  fileName: string
  fileType: string
  storagePath: string
  kbCode: string
  content: string
}

export interface LangChain4jRagResponse {
  question: string
  answer: string
  provider: string
  model: string
  topK: number
  minScore: number
  hitCount: number
  chunks: LangChain4jRagChunk[]
  promptContext: string
}

export interface LangChain4jSequentialRagResponse {
  conversationId: string
  question: string
  answer: string
  provider: string
  model: string
  topK: number
  minScore: number
  hitCount: number
  estimatedInputTokens?: number
  memoryTokens?: number
  contextTokens?: number
  summaryTokens?: number
  memoryContext?: string
  retrievedContextSummary?: string
  chunks: LangChain4jRagChunk[]
}

export interface ChatContextMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  timestamp?: string
}

export type ActuatorStatus = 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN'

export interface ActuatorHealthComponent {
  status: ActuatorStatus | string
  details?: Record<string, unknown>
  components?: Record<string, ActuatorHealthComponent>
}

export interface ActuatorHealth {
  status: ActuatorStatus | string
  components?: Record<string, ActuatorHealthComponent>
  groups?: string[]
}

export interface ActuatorMetrics {
  names: string[]
}
