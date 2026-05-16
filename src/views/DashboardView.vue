<template>
  <div class="page">
    <div class="page-header">
      <div>
        <h1 class="page-title">仪表盘</h1>
        <p class="page-subtitle">后端健康、模型配置和知识库状态概览</p>
      </div>
      <el-button :icon="Refresh" :loading="loading" @click="load">刷新</el-button>
    </div>

    <el-alert
      v-if="hasPartialError"
      title="部分接口暂时不可用，已展示当前可获取的数据"
      type="warning"
      show-icon
      :closable="false"
    />

    <el-row :gutter="16">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric panel">
          <span :class="['status-dot', healthOk ? 'ok' : 'fail']"></span>
          <div>
            <div class="metric-value">{{ healthOk ? 'UP' : 'DOWN' }}</div>
            <div class="metric-label">服务健康</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric panel">
          <el-icon><Cpu /></el-icon>
          <div>
            <div class="metric-value">{{ modelConfig?.providers.length || 0 }}</div>
            <div class="metric-label">模型供应商，启用 {{ enabledProviderCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric panel">
          <el-icon><Files /></el-icon>
          <div>
            <div class="metric-value">{{ documents?.total || 0 }}</div>
            <div class="metric-label">知识库文档，成功 {{ successDocumentCount }}</div>
          </div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="metric panel">
          <el-icon><Connection /></el-icon>
          <div>
            <div class="metric-value">{{ defaultProviderLabel }}</div>
            <div class="metric-label">默认供应商</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <div class="panel">
          <h3>供应商状态</h3>
          <el-table v-loading="loading" :data="modelConfig?.providers || []" height="300" empty-text="暂无模型配置">
            <el-table-column prop="displayName" label="名称" min-width="140" />
            <el-table-column prop="provider" label="Provider" width="110" />
            <el-table-column prop="defaultModel" label="默认模型" min-width="180" />
            <el-table-column label="启用" width="90">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'" effect="plain">
                  {{ row.enabled ? '启用' : '停用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="Key" width="90">
              <template #default="{ row }">
                <el-tag :type="row.apiKeyConfigured ? 'success' : 'warning'" effect="plain">
                  {{ row.apiKeyConfigured ? '已配置' : '未配置' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :xs="24" :lg="10">
        <div class="panel">
          <h3>最近文档</h3>
          <el-table v-loading="loading" :data="documents?.records || []" height="300" empty-text="暂无文档">
            <el-table-column prop="fileName" label="文件" min-width="180" show-overflow-tooltip />
            <el-table-column label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="documentStatusType(row.parseStatus)" effect="plain">
                  {{ documentStatusText(row.parseStatus) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="160">
              <template #default="{ row }">{{ formatDateTime(row.createTime) }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <div class="trace">最后刷新：{{ lastRefresh ? formatDateTime(lastRefresh) : '-' }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Connection, Cpu, Files, Refresh } from '@element-plus/icons-vue'
import { getHealth } from '@/api/health'
import { getModelConfig } from '@/api/modelConfig'
import { pageDocuments } from '@/api/documents'
import type { DocumentPage, ModelConfigResponse } from '@/types/api'
import { documentStatusText, documentStatusType, formatDateTime } from '@/utils/document'

const loading = ref(false)
const healthOk = ref(false)
const hasPartialError = ref(false)
const lastRefresh = ref('')
const modelConfig = ref<ModelConfigResponse>()
const documents = ref<DocumentPage>()

const enabledProviderCount = computed(() => modelConfig.value?.providers.filter((item) => item.enabled).length || 0)
const successDocumentCount = computed(
  () => documents.value?.records.filter((item) => item.parseStatus === 2).length || 0
)
const defaultProviderLabel = computed(() => modelConfig.value?.defaultProvider || '-')

async function load() {
  loading.value = true
  try {
    const [health, config, docs] = await Promise.allSettled([
      getHealth(),
      getModelConfig(),
      pageDocuments({ pageNo: 1, pageSize: 8, kbCode: 'default' })
    ])
    healthOk.value = health.status === 'fulfilled' && health.value.data.status === 'UP'
    if (config.status === 'fulfilled') modelConfig.value = config.value.data
    if (docs.status === 'fulfilled') documents.value = docs.value.data
    hasPartialError.value = [health, config, docs].some((item) => item.status === 'rejected')
    lastRefresh.value = new Date().toISOString()
  } finally {
    loading.value = false
  }
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
  color: #172033;
}

.trace {
  text-align: right;
}
</style>
