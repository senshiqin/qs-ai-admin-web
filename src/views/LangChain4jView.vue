<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">LangChain4j 调试</h1>
        <p class="page-subtitle">验证 Embedding、ChatModel、RetrievalChain 和 SequentialChain</p>
      </div>
      <el-tag effect="plain">LangChain4j</el-tag>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="9">
        <div class="panel control-panel">
          <el-tabs v-model="activeMode" stretch>
            <el-tab-pane label="Embedding" name="embed" />
            <el-tab-pane label="Chat" name="chat" />
            <el-tab-pane label="RAG" name="rag" />
            <el-tab-pane label="Sequential" name="sequential" />
          </el-tabs>

          <el-form label-position="top">
            <template v-if="activeMode === 'embed'">
              <el-form-item label="文本">
                <el-input v-model="embedForm.text" type="textarea" :rows="8" />
              </el-form-item>
              <el-button type="primary" :icon="Cpu" :loading="loading" @click="runEmbed">向量化</el-button>
            </template>

            <template v-else-if="activeMode === 'chat'">
              <el-form-item label="System Prompt">
                <el-input v-model="chatForm.systemPrompt" type="textarea" :rows="4" />
              </el-form-item>
              <el-form-item label="用户消息">
                <el-input v-model="chatForm.message" type="textarea" :rows="5" />
              </el-form-item>
              <el-form-item label="Model">
                <el-input v-model="chatForm.model" clearable placeholder="默认模型" />
              </el-form-item>
              <el-form-item label="Temperature">
                <el-slider v-model="chatForm.temperature" :min="0" :max="2" :step="0.1" show-input />
              </el-form-item>
              <el-button type="primary" :icon="ChatDotRound" :loading="loading" @click="runChat">运行 Chat</el-button>
            </template>

            <template v-else>
              <el-form-item label="问题">
                <el-input v-model="chainForm.question" type="textarea" :rows="5" />
              </el-form-item>
              <el-form-item label="Conversation ID" v-if="activeMode === 'sequential'">
                <el-input v-model="chainForm.conversationId" clearable />
              </el-form-item>
              <el-form-item label="Provider">
                <el-select
                  v-model="chainForm.provider"
                  clearable
                  filterable
                  :loading="modelConfigLoading"
                  placeholder="默认"
                  @change="handleProviderChange"
                >
                  <el-option
                    v-for="option in providerOptions"
                    :key="option.key"
                    :label="option.label"
                    :value="option.value"
                    :disabled="!option.enabled"
                  >
                    <div class="provider-option">
                      <span>{{ option.label }}</span>
                      <span class="muted">{{ option.defaultModel || '未设置默认模型' }}</span>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="Model">
                <el-input v-model="chainForm.model" clearable placeholder="默认模型">
                  <template #append>
                    <el-tooltip content="填入默认模型">
                      <el-button :icon="MagicStick" @click="fillDefaultModel()" />
                    </el-tooltip>
                  </template>
                </el-input>
              </el-form-item>
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-form-item label="TopK">
                    <el-input-number v-model="chainForm.topK" :min="1" :max="20" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="MinScore">
                    <el-input-number v-model="chainForm.minScore" :min="0" :max="1" :step="0.05" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="Temperature">
                <el-slider v-model="chainForm.temperature" :min="0" :max="2" :step="0.1" show-input />
              </el-form-item>
              <el-form-item label="Max Tokens">
                <el-input-number v-model="chainForm.maxTokens" :min="128" :step="128" />
              </el-form-item>

              <div v-if="activeMode === 'sequential'" class="advanced-grid">
                <el-form-item label="输入 Token">
                  <el-input-number v-model="chainForm.maxInputTokens" :min="256" :step="256" />
                </el-form-item>
                <el-form-item label="记忆 Token">
                  <el-input-number v-model="chainForm.maxMemoryTokens" :min="0" :step="128" />
                </el-form-item>
                <el-form-item label="上下文 Token">
                  <el-input-number v-model="chainForm.maxContextTokens" :min="256" :step="256" />
                </el-form-item>
                <el-form-item label="摘要 Token">
                  <el-input-number v-model="chainForm.summaryMaxTokens" :min="128" :step="128" />
                </el-form-item>
                <el-form-item label="回答 Token">
                  <el-input-number v-model="chainForm.answerMaxTokens" :min="128" :step="128" />
                </el-form-item>
                <el-form-item label="保存记忆">
                  <el-switch v-model="chainForm.saveMemory" />
                </el-form-item>
              </div>

              <el-button
                type="primary"
                :icon="activeMode === 'rag' ? Search : Connection"
                :loading="loading"
                @click="activeMode === 'rag' ? runRag() : runSequential()"
              >
                {{ activeMode === 'rag' ? '运行 RetrievalChain' : '运行 SequentialChain' }}
              </el-button>
            </template>
          </el-form>
        </div>
      </el-col>

      <el-col :xs="24" :lg="15">
        <div class="panel result-panel">
          <el-empty v-if="!result" description="运行后展示结果" />
          <template v-else>
            <el-descriptions :column="3" border class="result-summary">
              <el-descriptions-item v-for="item in summaryItems" :key="item.label" :label="item.label">
                {{ item.value }}
              </el-descriptions-item>
            </el-descriptions>

            <el-tabs v-model="resultTab">
              <el-tab-pane label="回答" name="answer">
                <div class="answer">{{ answerText || '暂无回答' }}</div>
              </el-tab-pane>
              <el-tab-pane label="切片" name="chunks">
                <el-table :data="chunkRows" height="360" empty-text="暂无切片">
                  <el-table-column label="Score" width="90">
                    <template #default="{ row }">{{ formatScore(row.score) }}</template>
                  </el-table-column>
                  <el-table-column prop="fileName" label="文件" width="180" show-overflow-tooltip />
                  <el-table-column prop="content" label="内容" min-width="320" show-overflow-tooltip />
                </el-table>
              </el-tab-pane>
              <el-tab-pane label="上下文" name="context">
                <pre class="code-block">{{ contextText || '暂无上下文' }}</pre>
              </el-tab-pane>
              <el-tab-pane label="原始结果" name="raw">
                <pre class="code-block">{{ JSON.stringify(result, null, 2) }}</pre>
              </el-tab-pane>
            </el-tabs>
          </template>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Connection, Cpu, MagicStick, Search } from '@element-plus/icons-vue'
import { embedText, langChainChat, langChainRag, langChainSequentialRag } from '@/api/langchain4j'
import type {
  LangChain4jChatResponse,
  LangChain4jEmbedResponse,
  LangChain4jRagChunk,
  LangChain4jRagResponse,
  LangChain4jSequentialRagResponse
} from '@/types/api'
import { useModelConfigOptions } from '@/composables/useModelConfigOptions'

type Mode = 'embed' | 'chat' | 'rag' | 'sequential'
type Result =
  | LangChain4jEmbedResponse
  | LangChain4jChatResponse
  | LangChain4jRagResponse
  | LangChain4jSequentialRagResponse

const activeMode = ref<Mode>('rag')
const resultTab = ref('answer')
const loading = ref(false)
const result = ref<Result>()
const { modelConfigLoading, providerOptions, loadModelConfigOptions, resolveDefaultModel } = useModelConfigOptions()

const embedForm = reactive({
  text: 'LangChain4j 将模型、向量、检索和链路编排抽象成可组合组件。'
})

const chatForm = reactive({
  systemPrompt: '你是 QS-AI 后台调试助手，请回答得简洁、准确。',
  message: '请介绍 LangChain4j 在这个项目中的作用。',
  model: '',
  temperature: 0.7
})

const chainForm = reactive({
  question: '请总结知识库里关于多模型动态配置的实现方式',
  conversationId: `seq-${Date.now()}`,
  provider: 'QWEN',
  model: '',
  topK: 5,
  minScore: 0.55,
  temperature: 0.7,
  maxTokens: 1024,
  maxInputTokens: 4096,
  maxMemoryTokens: 1024,
  maxContextTokens: 2048,
  summaryMaxTokens: 512,
  answerMaxTokens: 1024,
  saveMemory: true
})

const answerText = computed(() => {
  if (!result.value) return ''
  if ('answer' in result.value) return result.value.answer || ''
  if ('preview' in result.value) return `模型：${result.value.model}\n维度：${result.value.dimension}\n预览：${result.value.preview.join(', ')}`
  return ''
})

const chunkRows = computed<LangChain4jRagChunk[]>(() => {
  if (!result.value || !('chunks' in result.value)) return []
  return result.value.chunks || []
})

const contextText = computed(() => {
  if (!result.value) return ''
  if ('promptContext' in result.value) return result.value.promptContext || ''
  if ('retrievedContextSummary' in result.value) {
    return [
      result.value.memoryContext ? `Memory:\n${result.value.memoryContext}` : '',
      result.value.retrievedContextSummary ? `Retrieved Summary:\n${result.value.retrievedContextSummary}` : ''
    ]
      .filter(Boolean)
      .join('\n\n')
  }
  return ''
})

const summaryItems = computed(() => {
  const current = result.value
  if (!current) return []
  if ('dimension' in current) {
    return [
      { label: '模型', value: current.model || '-' },
      { label: '维度', value: current.dimension || '-' },
      { label: '预览长度', value: current.preview?.length || 0 }
    ]
  }
  if ('totalTokens' in current) {
    return [
      { label: '模型', value: current.model || '-' },
      { label: '输入 Token', value: current.promptTokens ?? '-' },
      { label: '总 Token', value: current.totalTokens ?? '-' }
    ]
  }
  if ('estimatedInputTokens' in current) {
    return [
      { label: '会话', value: current.conversationId || '-' },
      { label: '模型', value: current.model || '-' },
      { label: '命中', value: current.hitCount ?? 0 },
      { label: '输入 Token', value: current.estimatedInputTokens ?? '-' },
      { label: '记忆 Token', value: current.memoryTokens ?? '-' },
      { label: '上下文 Token', value: current.contextTokens ?? '-' }
    ]
  }
  if ('provider' in current) {
    return [
      { label: 'Provider', value: current.provider || '-' },
      { label: '模型', value: current.model || '-' },
      { label: '命中', value: current.hitCount ?? 0 },
      { label: 'TopK', value: current.topK ?? '-' },
      { label: 'MinScore', value: current.minScore ?? '-' }
    ]
  }
  return [
    { label: '模型', value: current.model || '-' },
    { label: '输入 Token', value: current.promptTokens ?? '-' },
    { label: '总 Token', value: current.totalTokens ?? '-' }
  ]
})

async function runEmbed() {
  if (!embedForm.text.trim()) return ElMessage.warning('请输入文本')
  await run(async () => {
    const response = await embedText({ text: embedForm.text.trim() })
    result.value = response.data
  })
}

async function runChat() {
  if (!chatForm.message.trim()) return ElMessage.warning('请输入用户消息')
  await run(async () => {
    const response = await langChainChat({ ...chatForm, message: chatForm.message.trim() })
    result.value = response.data
  })
}

async function runRag() {
  if (!chainForm.question.trim()) return ElMessage.warning('请输入问题')
  await run(async () => {
    const response = await langChainRag({
      question: chainForm.question.trim(),
      provider: chainForm.provider,
      model: chainForm.model,
      temperature: chainForm.temperature,
      topK: chainForm.topK,
      minScore: chainForm.minScore,
      maxTokens: chainForm.maxTokens
    })
    result.value = response.data
  })
}

async function runSequential() {
  if (!chainForm.question.trim()) return ElMessage.warning('请输入问题')
  await run(async () => {
    const response = await langChainSequentialRag({
      question: chainForm.question.trim(),
      conversationId: chainForm.conversationId,
      provider: chainForm.provider,
      model: chainForm.model,
      temperature: chainForm.temperature,
      topK: chainForm.topK,
      minScore: chainForm.minScore,
      maxInputTokens: chainForm.maxInputTokens,
      maxMemoryTokens: chainForm.maxMemoryTokens,
      maxContextTokens: chainForm.maxContextTokens,
      summaryMaxTokens: chainForm.summaryMaxTokens,
      answerMaxTokens: chainForm.answerMaxTokens,
      saveMemory: chainForm.saveMemory
    })
    result.value = response.data
    chainForm.conversationId = response.data.conversationId
  })
}

async function run(task: () => Promise<void>) {
  loading.value = true
  result.value = undefined
  resultTab.value = 'answer'
  try {
    await task()
  } finally {
    loading.value = false
  }
}

function handleProviderChange() {
  fillDefaultModel(false)
}

function fillDefaultModel(showMessage = true) {
  const defaultModel = resolveDefaultModel(chainForm.provider)
  if (defaultModel) {
    chainForm.model = defaultModel
    return
  }
  chainForm.model = ''
  if (showMessage) ElMessage.info('当前供应商没有默认模型')
}

function formatScore(score?: number) {
  return typeof score === 'number' ? score.toFixed(4) : '-'
}

onMounted(async () => {
  try {
    await loadModelConfigOptions()
    fillDefaultModel(false)
  } catch {
    // HTTP interceptor already surfaces the backend error to the user.
  }
})
</script>

<style scoped>
.control-panel,
.result-panel {
  min-height: 680px;
}

.result-summary {
  margin-bottom: 14px;
}

.answer {
  min-height: 360px;
  max-height: 520px;
  overflow: auto;
  white-space: pre-wrap;
  line-height: 1.8;
}

.advanced-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 10px;
}

.provider-option {
  display: flex;
  min-width: 260px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
</style>
