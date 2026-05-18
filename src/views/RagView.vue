<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">RAG 调试</h1>
        <p class="page-subtitle">按知识库检索切片、查看来源上下文，并测试流式问答。</p>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="9">
        <div class="panel">
          <el-form label-position="top">
            <el-form-item label="调试模式">
              <el-segmented v-model="mode" :options="modeOptions" />
            </el-form-item>
            <el-form-item label="知识库">
              <el-select v-model="form.kbCode" filterable placeholder="default">
                <el-option
                  v-for="item in knowledgeBases"
                  :key="item.kbCode"
                  :label="`${item.name} (${item.kbCode})`"
                  :value="item.kbCode"
                  :disabled="item.status !== 1"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="问题">
              <el-input v-model="form.queryText" type="textarea" :rows="5" />
            </el-form-item>
            <el-row v-if="mode !== 'basic'" :gutter="10">
              <el-col :span="12">
                <el-form-item label="Query Rewrite">
                  <el-switch v-model="form.rewrite" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="LLM Rewrite">
                  <el-switch v-model="form.rewriteWithLlm" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="10">
              <el-col :span="12">
                <el-form-item label="TopK">
                  <el-input-number v-model="form.topK" :min="1" :max="20" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="MinScore">
                  <el-input-number v-model="form.minScore" :min="0" :max="1" :step="0.05" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item v-if="mode === 'advanced'" label="Candidate TopK">
              <el-input-number v-model="form.candidateTopK" :min="form.topK" :max="100" />
            </el-form-item>
            <el-form-item label="Provider">
              <el-select
                v-model="form.provider"
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
              <el-input v-model="form.model" clearable placeholder="默认模型">
                <template #append>
                  <el-tooltip content="填入默认模型">
                    <el-button :icon="MagicStick" @click="fillDefaultModel()" />
                  </el-tooltip>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item label="Temperature">
              <el-slider v-model="form.temperature" :min="0" :max="2" :step="0.1" show-input />
            </el-form-item>
            <template v-if="mode === 'eval'">
              <el-form-item label="Expected Keywords">
                <el-select
                  v-model="expectedKeywords"
                  multiple
                  filterable
                  allow-create
                  default-first-option
                  placeholder="输入关键词后回车"
                />
              </el-form-item>
              <el-form-item label="Expected File Name">
                <el-input v-model="form.expectedFileName" clearable placeholder="可选" />
              </el-form-item>
            </template>
            <div class="toolbar">
              <el-button
                type="primary"
                :icon="Search"
                :loading="retrieving"
                :disabled="streaming"
                @click="runPrimaryAction"
              >
                {{ primaryActionText }}
              </el-button>
              <el-button :icon="EditPen" :loading="rewriting" @click="rewriteOnly">仅改写</el-button>
              <el-button :icon="VideoPlay" :loading="streaming" :disabled="retrieving" @click="askStream">
                流式问答
              </el-button>
            </div>
          </el-form>
        </div>
      </el-col>

      <el-col :xs="24" :lg="15">
        <div class="panel result-panel">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="回答" name="answer">
              <el-descriptions v-if="rewriteSummary.length || evalResult" :column="3" border class="rag-summary">
                <el-descriptions-item label="知识库">{{ currentResultKbCode || form.kbCode }}</el-descriptions-item>
                <el-descriptions-item v-for="item in rewriteSummary" :key="item.label" :label="item.label">
                  {{ item.value }}
                </el-descriptions-item>
                <template v-if="evalResult">
                  <el-descriptions-item label="评估结果">
                    <el-tag :type="evalResult.passed ? 'success' : 'danger'" effect="plain">
                      {{ evalResult.passed ? '通过' : '未通过' }}
                    </el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="关键词召回">
                    {{ formatPercent(evalResult.keywordRecall) }}
                  </el-descriptions-item>
                  <el-descriptions-item label="文件命中">
                    {{ evalResult.expectedFileHit ? '是' : '否' }}
                  </el-descriptions-item>
                </template>
              </el-descriptions>
              <div v-if="streamMeta" class="trace answer-meta">{{ streamMeta }}</div>
              <div class="answer">{{ answer || '暂无回答' }}</div>
            </el-tab-pane>
            <el-tab-pane label="命中切片" name="chunks">
              <el-table :data="chunkRows" height="420" empty-text="暂无命中切片">
                <el-table-column prop="kbCode" label="知识库" width="100" />
                <el-table-column label="Vector" width="90">
                  <template #default="{ row }">{{ formatScore(row.vectorScore ?? row.score) }}</template>
                </el-table-column>
                <el-table-column label="Keyword" width="90">
                  <template #default="{ row }">{{ formatScore(row.keywordScore) }}</template>
                </el-table-column>
                <el-table-column label="Rerank" width="90">
                  <template #default="{ row }">{{ formatScore(row.rerankScore) }}</template>
                </el-table-column>
                <el-table-column prop="fileName" label="文件" width="180" show-overflow-tooltip />
                <el-table-column prop="content" label="内容" min-width="320" show-overflow-tooltip />
              </el-table>
            </el-tab-pane>
            <el-tab-pane label="评估" name="eval">
              <div v-if="evalResult" class="eval-panel">
                <el-alert
                  :title="evalResult.passed ? '评估通过' : '评估未通过'"
                  :type="evalResult.passed ? 'success' : 'warning'"
                  show-icon
                  :closable="false"
                />
                <div class="eval-tags">
                  <span class="muted">命中关键词</span>
                  <el-tag v-for="keyword in evalResult.matchedKeywords" :key="keyword" type="success" effect="plain">
                    {{ keyword }}
                  </el-tag>
                </div>
                <div class="eval-tags">
                  <span class="muted">缺失关键词</span>
                  <el-tag v-for="keyword in evalResult.missingKeywords" :key="keyword" type="danger" effect="plain">
                    {{ keyword }}
                  </el-tag>
                </div>
              </div>
              <el-empty v-else description="运行评估后展示结果" />
            </el-tab-pane>
            <el-tab-pane label="RAG Context" name="context">
              <pre class="code-block">{{ contextText || '暂无上下文' }}</pre>
            </el-tab-pane>
          </el-tabs>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { EditPen, MagicStick, Search, VideoPlay } from '@element-plus/icons-vue'
import { listKnowledgeBases } from '@/api/knowledgeBase'
import { evaluateRag, retrieveRag, retrieveRagAdvanced, rewriteRagQuery, streamRagAnswer } from '@/api/rag'
import type {
  KnowledgeBase,
  RagAdvancedRetrieveResponse,
  RagChunk,
  RagEvalResponse,
  RagRerankChunk,
  RagRetrieveResponse,
  RagRewriteResponse
} from '@/types/api'
import { useModelConfigOptions } from '@/composables/useModelConfigOptions'

type RagMode = 'basic' | 'advanced' | 'eval'

const retrieving = ref(false)
const rewriting = ref(false)
const streaming = ref(false)
const answer = ref('')
const streamMeta = ref('')
const activeTab = ref('answer')
const mode = ref<RagMode>('advanced')
const retrieval = ref<RagRetrieveResponse>()
const advancedResult = ref<RagAdvancedRetrieveResponse>()
const rewriteResult = ref<RagRewriteResponse>()
const evalResult = ref<RagEvalResponse>()
const expectedKeywords = ref<string[]>(['Qwen', 'DeepSeek', 'Ollama', '模型路由'])
const knowledgeBases = ref<KnowledgeBase[]>([])
const { modelConfigLoading, providerOptions, loadModelConfigOptions, resolveDefaultModel } = useModelConfigOptions()

const modeOptions = [
  { label: '基础检索', value: 'basic' },
  { label: '增强检索', value: 'advanced' },
  { label: '检索评估', value: 'eval' }
]

const form = reactive({
  kbCode: 'default',
  queryText: '请总结知识库里关于多模型动态配置的实现方式',
  topK: 5,
  minScore: 0.55,
  provider: 'QWEN',
  model: '',
  temperature: 0.7,
  rewrite: true,
  rewriteWithLlm: false,
  candidateTopK: 15,
  expectedFileName: ''
})

const primaryActionText = computed(() => {
  if (mode.value === 'basic') return '检索'
  if (mode.value === 'advanced') return '增强检索'
  return '运行评估'
})

const chunkRows = computed<Array<RagChunk | RagRerankChunk>>(() => {
  if (mode.value === 'advanced') return advancedResult.value?.chunks || []
  if (mode.value === 'eval') return evalResult.value?.chunks || []
  return retrieval.value?.chunks || []
})

const contextText = computed(() => advancedResult.value?.ragContext || retrieval.value?.ragContext || '')

const currentResultKbCode = computed(
  () => retrieval.value?.kbCode || advancedResult.value?.kbCode || evalResult.value?.kbCode || ''
)

const rewriteSummary = computed(() => {
  const result = advancedResult.value || evalResult.value || rewriteResult.value
  if (!result) return []
  const items = []
  if ('originalQuery' in result) items.push({ label: '原始 Query', value: result.originalQuery || '-' })
  else if ('queryText' in result) items.push({ label: '原始 Query', value: result.queryText || '-' })
  items.push({ label: '改写 Query', value: result.rewrittenQuery || '-' })
  if ('rewriteUsed' in result) items.push({ label: '使用改写', value: result.rewriteUsed ? '是' : '否' })
  if ('changed' in result) items.push({ label: '发生变化', value: result.changed ? '是' : '否' })
  if ('llmUsed' in result) items.push({ label: 'LLM 改写', value: result.llmUsed ? '是' : '否' })
  return items
})

async function loadKnowledgeBases() {
  const response = await listKnowledgeBases()
  knowledgeBases.value = response.data
  if (!knowledgeBases.value.some((item) => item.kbCode === form.kbCode)) {
    form.kbCode = knowledgeBases.value[0]?.kbCode || 'default'
  }
}

async function retrieve() {
  if (!validateQuery()) return
  retrieving.value = true
  clearEnhancedResult()
  try {
    const response = await retrieveRag(form)
    retrieval.value = response.data
    activeTab.value = 'chunks'
    ElMessage.success(`命中 ${response.data.hitCount} 个切片`)
  } finally {
    retrieving.value = false
  }
}

async function runPrimaryAction() {
  if (mode.value === 'basic') return retrieve()
  if (mode.value === 'advanced') return retrieveAdvanced()
  return runEval()
}

async function rewriteOnly() {
  if (!validateQuery()) return
  rewriting.value = true
  clearEnhancedResult()
  try {
    const response = await rewriteRagQuery({
      queryText: form.queryText,
      useLlm: form.rewriteWithLlm,
      provider: form.provider,
      model: form.model
    })
    rewriteResult.value = response.data
    answer.value = response.data.queryVariants?.join('\n') || response.data.rewrittenQuery
    activeTab.value = 'answer'
  } finally {
    rewriting.value = false
  }
}

async function retrieveAdvanced() {
  if (!validateQuery()) return
  retrieving.value = true
  clearEnhancedResult()
  try {
    const response = await retrieveRagAdvanced({
      queryText: form.queryText,
      kbCode: form.kbCode,
      topK: form.topK,
      minScore: form.minScore,
      rewrite: form.rewrite,
      rewriteWithLlm: form.rewriteWithLlm,
      provider: form.provider,
      model: form.model,
      candidateTopK: form.candidateTopK
    })
    advancedResult.value = response.data
    answer.value = `命中 ${response.data.hitCount} 个切片`
    activeTab.value = 'chunks'
  } finally {
    retrieving.value = false
  }
}

async function runEval() {
  if (!validateQuery()) return
  retrieving.value = true
  clearEnhancedResult()
  try {
    const response = await evaluateRag({
      queryText: form.queryText,
      kbCode: form.kbCode,
      expectedKeywords: expectedKeywords.value,
      expectedFileName: form.expectedFileName || undefined,
      topK: form.topK,
      minScore: form.minScore,
      rewrite: form.rewrite,
      rewriteWithLlm: form.rewriteWithLlm,
      provider: form.provider,
      model: form.model
    })
    evalResult.value = response.data
    answer.value = response.data.passed
      ? `评估通过，关键词召回 ${formatPercent(response.data.keywordRecall)}`
      : `评估未通过，关键词召回 ${formatPercent(response.data.keywordRecall)}`
    activeTab.value = 'eval'
  } finally {
    retrieving.value = false
  }
}

async function askStream() {
  if (!validateQuery()) return
  clearEnhancedResult()
  answer.value = ''
  streamMeta.value = ''
  activeTab.value = 'answer'
  streaming.value = true
  try {
    await streamRagAnswer(form, {
      onSources: (data) => {
        if (Array.isArray(data)) {
          const chunks = data as RagChunk[]
          retrieval.value = {
            queryText: form.queryText,
            kbCode: form.kbCode,
            topK: form.topK,
            minScore: form.minScore,
            embeddingModel: '',
            embeddingDimension: 0,
            hitCount: chunks.length,
            chunks,
            ragContext: ''
          }
        }
      },
      onMessage: (text) => {
        answer.value += text
      },
      onResult: (data) => {
        const result = data as { answer?: string; provider?: string; model?: string }
        if (!answer.value && result.answer) answer.value = result.answer
        streamMeta.value = [result.provider, result.model].filter(Boolean).join(' / ')
      },
      onError: (message) => ElMessage.error(message),
      onDone: () => ElMessage.success('问答完成')
    })
  } finally {
    streaming.value = false
  }
}

function validateQuery() {
  if (form.queryText.trim()) return true
  ElMessage.warning('请输入问题')
  return false
}

function clearEnhancedResult() {
  retrieval.value = undefined
  advancedResult.value = undefined
  evalResult.value = undefined
  rewriteResult.value = undefined
  answer.value = ''
}

function handleProviderChange() {
  fillDefaultModel(false)
}

function fillDefaultModel(showMessage = true) {
  const defaultModel = resolveDefaultModel(form.provider)
  if (defaultModel) {
    form.model = defaultModel
    return
  }
  form.model = ''
  if (showMessage) ElMessage.info('当前供应商没有默认模型')
}

function formatScore(score?: number) {
  return typeof score === 'number' ? score.toFixed(4) : '-'
}

function formatPercent(value?: number) {
  return typeof value === 'number' ? `${Math.round(value * 100)}%` : '-'
}

onMounted(async () => {
  try {
    await Promise.all([loadKnowledgeBases(), loadModelConfigOptions()])
    fillDefaultModel(false)
  } catch {
    // HTTP interceptor already surfaces backend errors to the user.
  }
})
</script>

<style scoped>
.result-panel {
  min-height: 560px;
}

.answer {
  min-height: 420px;
  max-height: 520px;
  overflow: auto;
  white-space: pre-wrap;
  line-height: 1.8;
}

.answer-meta {
  margin-bottom: 10px;
}

.rag-summary {
  margin-bottom: 12px;
}

.eval-panel {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.eval-tags {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.provider-option {
  display: flex;
  min-width: 260px;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
</style>
