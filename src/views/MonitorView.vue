<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">系统监控</h1>
        <p class="page-subtitle">读取 Actuator 健康状态和核心指标入口</p>
      </div>
      <div class="toolbar">
        <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
      </div>
    </div>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="8">
        <div class="metric panel">
          <span :class="['status-dot', healthStatusClass]"></span>
          <div>
            <div class="metric-value">{{ health?.status || '-' }}</div>
            <div class="metric-label">Actuator Health</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="metric panel">
          <el-icon><DataLine /></el-icon>
          <div>
            <div class="metric-value">{{ metrics?.names.length || 0 }}</div>
            <div class="metric-label">Metrics 指标数量</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="metric panel">
          <el-icon><Monitor /></el-icon>
          <div>
            <div class="metric-value">{{ prometheusLineCount }}</div>
            <div class="metric-label">Prometheus 文本行数</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="8">
        <div class="metric panel">
          <el-icon><DataAnalysis /></el-icon>
          <div>
            <div class="metric-value">{{ formatInteger(aiMetricSummary.totalRequests) }}</div>
            <div class="metric-label">AI 调用总数</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="metric panel">
          <el-icon><CircleCheck /></el-icon>
          <div>
            <div class="metric-value">{{ formatPercent(aiMetricSummary.successRate) }}</div>
            <div class="metric-label">AI 调用成功率</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :lg="8">
        <div class="metric panel">
          <el-icon><Timer /></el-icon>
          <div>
            <div class="metric-value">{{ formatDurationMs(aiMetricSummary.avgDurationMs) }}</div>
            <div class="metric-label">AI 平均耗时</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <div class="panel">
          <h3>健康组件</h3>
          <el-table v-loading="loading" :data="componentRows" border empty-text="暂无健康组件">
            <el-table-column prop="name" label="组件" width="160" />
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="healthTagType(row.status)" effect="plain">{{ row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="detailsText" label="详情" min-width="260" show-overflow-tooltip />
          </el-table>
        </div>
      </el-col>

      <el-col :xs="24" :lg="10">
        <div class="panel">
          <h3>核心指标入口</h3>
          <el-table :data="metricRows" height="360" empty-text="暂无指标">
            <el-table-column prop="name" label="Metric" min-width="220" show-overflow-tooltip />
          </el-table>
        </div>
      </el-col>
    </el-row>

    <div class="panel">
      <h3>AI 调用指标</h3>
      <el-table :data="aiMetricRows" border empty-text="暂无 AI 调用指标">
        <el-table-column prop="provider" label="Provider" width="120" />
        <el-table-column prop="mode" label="Mode" width="110" />
        <el-table-column label="调用数" width="110">
          <template #default="{ row }">{{ formatInteger(row.totalRequests) }}</template>
        </el-table-column>
        <el-table-column label="成功率" width="110">
          <template #default="{ row }">
            <el-tag :type="successRateTagType(row.successRate)" effect="plain">
              {{ formatPercent(row.successRate) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="平均耗时" width="120">
          <template #default="{ row }">{{ formatDurationMs(row.avgDurationMs) }}</template>
        </el-table-column>
        <el-table-column label="成功/失败" min-width="140">
          <template #default="{ row }">{{ formatInteger(row.successRequests) }} / {{ formatInteger(row.failedRequests) }}</template>
        </el-table-column>
      </el-table>
    </div>

    <div class="panel">
      <h3>Prometheus 预览</h3>
      <pre class="code-block">{{ prometheusPreview || '暂无 Prometheus 数据' }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheck, DataAnalysis, DataLine, Monitor, Refresh, Timer } from '@element-plus/icons-vue'
import { getActuatorHealth, getActuatorMetrics, getActuatorPrometheus } from '@/api/actuator'
import type { ActuatorHealth, ActuatorHealthComponent, ActuatorMetrics } from '@/types/api'
import type { ElementTagType } from '@/utils/document'

interface PrometheusSample {
  name: string
  labels: Record<string, string>
  value: number
}

interface AiMetricRow {
  provider: string
  mode: string
  totalRequests: number
  successRequests: number
  failedRequests: number
  successRate?: number
  avgDurationMs?: number
}

const loading = ref(false)
const health = ref<ActuatorHealth>()
const metrics = ref<ActuatorMetrics>()
const prometheus = ref('')

const healthStatusClass = computed(() => {
  if (health.value?.status === 'UP') return 'ok'
  if (health.value?.status === 'DOWN' || health.value?.status === 'OUT_OF_SERVICE') return 'fail'
  return 'warn'
})

const componentRows = computed(() =>
  Object.entries(health.value?.components || {}).map(([name, component]) => ({
    name,
    status: component.status,
    detailsText: formatComponentDetails(component)
  }))
)

const metricRows = computed(() => {
  const preferred = [
    'http.server.requests',
    'jvm.memory.used',
    'jvm.threads.live',
    'process.cpu.usage',
    'system.cpu.usage',
    'qs.ai.chat.duration',
    'qs.rag.retrieve.duration',
    'qs.rag.ingest.duration'
  ]
  const names = metrics.value?.names || []
  const ordered = [
    ...preferred.filter((name) => names.includes(name)),
    ...names.filter((name) => !preferred.includes(name)).slice(0, 40)
  ]
  return ordered.map((name) => ({ name }))
})

const prometheusLineCount = computed(() => prometheus.value.split('\n').filter(Boolean).length)
const prometheusPreview = computed(() => prometheus.value.split('\n').slice(0, 80).join('\n'))
const prometheusSamples = computed(() => parsePrometheusSamples(prometheus.value))
const aiMetricRows = computed(() => buildAiMetricRows(prometheusSamples.value))
const aiMetricSummary = computed(() => summarizeAiMetrics(aiMetricRows.value))

async function load() {
  loading.value = true
  try {
    const [healthResult, metricsResult, prometheusResult] = await Promise.allSettled([
      getActuatorHealth(),
      getActuatorMetrics(),
      getActuatorPrometheus()
    ])
    if (healthResult.status === 'fulfilled') health.value = healthResult.value
    if (metricsResult.status === 'fulfilled') metrics.value = metricsResult.value
    if (prometheusResult.status === 'fulfilled') prometheus.value = prometheusResult.value
    if ([healthResult, metricsResult, prometheusResult].some((item) => item.status === 'rejected')) {
      ElMessage.warning('部分 Actuator 接口暂时不可用')
    }
  } finally {
    loading.value = false
  }
}

function healthTagType(status: string): ElementTagType {
  if (status === 'UP') return 'success'
  if (status === 'DOWN' || status === 'OUT_OF_SERVICE') return 'danger'
  return 'warning'
}

function formatComponentDetails(component: ActuatorHealthComponent) {
  if (component.details && Object.keys(component.details).length > 0) {
    return JSON.stringify(component.details)
  }
  if (component.components) {
    return Object.entries(component.components)
      .map(([name, child]) => `${name}:${child.status}`)
      .join(', ')
  }
  return '-'
}

function parsePrometheusSamples(text: string): PrometheusSample[] {
  const samples: PrometheusSample[] = []
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .forEach((line) => {
      const match = line.match(/^([a-zA-Z_:][\w:]*)(?:\{([^}]*)\})?\s+([-+]?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?)$/)
      if (!match) return
      const value = Number(match[3])
      if (!Number.isFinite(value)) return
      samples.push({
        name: match[1],
        labels: parsePrometheusLabels(match[2] || ''),
        value
      })
    })
  return samples
}

function parsePrometheusLabels(labelsText: string) {
  const labels: Record<string, string> = {}
  labelsText.replace(/(\w+)="((?:\\"|[^"])*)"/g, (_, key: string, value: string) => {
    labels[key] = value.replace(/\\"/g, '"')
    return ''
  })
  return labels
}

function buildAiMetricRows(samples: PrometheusSample[]): AiMetricRow[] {
  const rows = new Map<string, AiMetricRow & { durationCount: number; durationSumSeconds: number }>()
  const ensureRow = (provider: string, mode: string) => {
    const key = `${provider}::${mode}`
    const existing = rows.get(key)
    if (existing) return existing
    const row = {
      provider,
      mode,
      totalRequests: 0,
      successRequests: 0,
      failedRequests: 0,
      durationCount: 0,
      durationSumSeconds: 0
    }
    rows.set(key, row)
    return row
  }

  samples.forEach((sample) => {
    if (!sample.name.startsWith('qs_ai_chat_')) return
    const provider = sample.labels.provider || 'unknown'
    const mode = sample.labels.mode || 'unknown'
    const row = ensureRow(provider, mode)

    if (sample.name === 'qs_ai_chat_requests_total') {
      row.totalRequests += sample.value
      if (sample.labels.success === 'true') row.successRequests += sample.value
      else if (sample.labels.success === 'false') row.failedRequests += sample.value
    }
    if (sample.name === 'qs_ai_chat_duration_seconds_count') {
      row.durationCount += sample.value
    }
    if (sample.name === 'qs_ai_chat_duration_seconds_sum') {
      row.durationSumSeconds += sample.value
    }
  })

  return Array.from(rows.values())
    .map((row) => ({
      provider: row.provider,
      mode: row.mode,
      totalRequests: row.totalRequests,
      successRequests: row.successRequests,
      failedRequests: row.failedRequests,
      successRate: row.totalRequests > 0 ? row.successRequests / row.totalRequests : undefined,
      avgDurationMs: row.durationCount > 0 ? (row.durationSumSeconds / row.durationCount) * 1000 : undefined
    }))
    .filter((row) => row.totalRequests > 0 || row.avgDurationMs !== undefined)
    .sort((left, right) => right.totalRequests - left.totalRequests || left.provider.localeCompare(right.provider))
}

function summarizeAiMetrics(rows: AiMetricRow[]) {
  const totalRequests = rows.reduce((sum, row) => sum + row.totalRequests, 0)
  const successRequests = rows.reduce((sum, row) => sum + row.successRequests, 0)
  const weightedDurationTotal = rows.reduce(
    (sum, row) => sum + (row.avgDurationMs || 0) * row.totalRequests,
    0
  )
  return {
    totalRequests,
    successRate: totalRequests > 0 ? successRequests / totalRequests : undefined,
    avgDurationMs: totalRequests > 0 ? weightedDurationTotal / totalRequests : undefined
  }
}

function successRateTagType(value?: number): ElementTagType {
  if (value === undefined) return 'info'
  if (value >= 0.98) return 'success'
  if (value >= 0.9) return 'warning'
  return 'danger'
}

function formatInteger(value?: number) {
  return typeof value === 'number' ? Math.round(value).toLocaleString() : '-'
}

function formatPercent(value?: number) {
  return typeof value === 'number' ? `${(value * 100).toFixed(1)}%` : '-'
}

function formatDurationMs(value?: number) {
  if (typeof value !== 'number') return '-'
  if (value >= 1000) return `${(value / 1000).toFixed(2)}s`
  return `${Math.round(value)}ms`
}

onMounted(load)
</script>

<style scoped>
.metric {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 96px;
}

.metric :deep(.el-icon) {
  color: #1d4ed8;
  font-size: 26px;
}

.metric-value {
  color: #111827;
  font-size: 24px;
  font-weight: 800;
}

.metric-label {
  color: #64748b;
  font-size: 13px;
}

h3 {
  margin: 0 0 14px;
}
</style>
