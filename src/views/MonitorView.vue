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
      <h3>Prometheus 预览</h3>
      <pre class="code-block">{{ prometheusPreview || '暂无 Prometheus 数据' }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { DataLine, Monitor, Refresh } from '@element-plus/icons-vue'
import { getActuatorHealth, getActuatorMetrics, getActuatorPrometheus } from '@/api/actuator'
import type { ActuatorHealth, ActuatorHealthComponent, ActuatorMetrics } from '@/types/api'
import type { ElementTagType } from '@/utils/document'

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
